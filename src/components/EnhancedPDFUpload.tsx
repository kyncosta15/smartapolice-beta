
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';
import { useFileStatusManager } from '@/hooks/useFileStatusManager';
import { FileProcessor } from '@/services/fileProcessor';
import { DuplicateInfo } from '@/services/processors/batchFileProcessor';
import { FileStatusList } from './FileStatusList';
import { EnhancedPDFUploadProps } from '@/types/pdfUpload';
import { useAuth } from '@/contexts/AuthContext';
import { DuplicatePolicyNotification } from './DuplicatePolicyNotification';

export function EnhancedPDFUpload({ onPolicyExtracted }: EnhancedPDFUploadProps) {
  const { 
    fileStatuses, 
    updateFileStatus, 
    removeFileStatus, 
    getActiveFiles, 
    getProcessingCount 
  } = useFileStatusManager();
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // DEBUG: Log sempre que duplicateInfo mudar
  useEffect(() => {
    console.log('🔔🔔🔔 STATE duplicateInfo MUDOU:', duplicateInfo);
    if (duplicateInfo) {
      console.log('✅✅✅ DUPLICATA INFO SETADA NO STATE:', {
        policyNumber: duplicateInfo.policyNumber,
        policyId: duplicateInfo.policyId,
        policyName: duplicateInfo.policyName
      });
    }
  }, [duplicateInfo]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    // VERIFICAÇÃO CRÍTICA: Usuário deve estar autenticado
    if (!user?.id) {
      console.error("❌ Usuário não autenticado:", { user });
      toast({
        title: "❌ Erro de Autenticação",
        description: "Você precisa estar logado para fazer upload de arquivos. Faça login e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    console.log(`📁 ${acceptedFiles.length} arquivo(s) selecionado(s)`);
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    
    toast({
      title: "✅ Arquivos Adicionados",
      description: `${acceptedFiles.length} arquivo(s) pronto(s) para envio`,
    });
  }, [toast, user?.id]);

  const handleSendFiles = useCallback(async () => {
    console.log('🖱️🖱️🖱️ BOTÃO PROCESSAR CLICADO!');
    console.log('📦 selectedFiles:', selectedFiles);
    console.log('📊 Quantidade de arquivos:', selectedFiles.length);
    
    if (selectedFiles.length === 0) {
      console.warn('⚠️ Nenhum arquivo selecionado');
      toast({
        title: "⚠️ Nenhum Arquivo",
        description: "Selecione pelo menos um arquivo antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.error("❌ Usuário não autenticado:", { user });
      toast({
        title: "❌ Erro de Autenticação",
        description: "Você precisa estar logado para fazer upload de arquivos.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🚀🚀🚀 INICIANDO PROCESSAMENTO DE ${selectedFiles.length} ARQUIVO(S)`);
    console.log(`👤 User ID autenticado:`, user.id);
    console.log(`📧 User email:`, user.email);
    
    setIsProcessingBatch(true);

    try {
      const fileProcessor = new FileProcessor(
        updateFileStatus,
        removeFileStatus,
        user.id,
        onPolicyExtracted,
        toast,
        (info) => {
          console.log('🔔 CALLBACK DE DUPLICATA CHAMADO!');
          console.log('📋 Info recebida:', info);
          setDuplicateInfo(info);
        }
      );

      console.log(`🚀 Processando ${selectedFiles.length} arquivos via webhook`);
      
      const allResults = await fileProcessor.processMultipleFiles(selectedFiles, user.email);
      
      console.log(`🎉 Processamento completo! ${allResults.length} apólices extraídas e salvas`);
      
      allResults.forEach(policy => {
        onPolicyExtracted(policy);
      });
      
      if (allResults.length > 0) {
        toast({
          title: "🎉 Upload Concluído com Sucesso",
          description: `${allResults.length} apólice(s) foram processadas e salvas no seu perfil`,
        });
        setSelectedFiles([]); // Limpar arquivos após sucesso
      } else {
        toast({
          title: "⚠️ Nenhuma Apólice Processada",
          description: "Não foi possível extrair dados dos arquivos enviados.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: "❌ Erro no Processamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
      console.log('🏁 Processamento finalizado');
    }
  }, [selectedFiles, toast, user?.id, user?.email, updateFileStatus, removeFileStatus, onPolicyExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    multiple: true,
    disabled: isProcessingBatch || !user?.id,
    noClick: selectedFiles.length > 0, // Desabilitar click se já houver arquivos
  });

  const activeFiles = getActiveFiles();
  const processingCount = getProcessingCount();

  // Mostrar aviso se usuário não estiver autenticado
  if (!user?.id) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-600">
            <Cloud className="h-5 w-5" />
            <span>Upload de Apólices</span>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Você precisa estar logado para fazer upload de arquivos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 border-2 border-dashed border-orange-300 rounded-md bg-orange-50">
            <p className="text-orange-700">
              Faça login na sua conta para começar a importar suas apólices.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* DEBUG VISUAL - Indicador permanente quando duplicata é detectada */}
      {duplicateInfo && (
        <div className="fixed top-4 right-4 z-[9999] bg-amber-500 text-white p-4 rounded-lg shadow-2xl border-4 border-white animate-pulse">
          <div className="font-bold text-lg">🔔 DUPLICATA DETECTADA!</div>
          <div className="text-sm">{duplicateInfo.policyNumber}</div>
          <button 
            onClick={() => setDuplicateInfo(null)}
            className="mt-2 bg-white text-amber-500 px-3 py-1 rounded font-semibold hover:bg-amber-100"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Modal de Duplicata com backdrop */}
      {duplicateInfo && (
        <>
          <div 
            className="fixed inset-0 z-[998] bg-black/70 backdrop-blur-sm" 
            onClick={() => {
              console.log('🖱️ Backdrop clicado');
              setDuplicateInfo(null);
            }} 
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <DuplicatePolicyNotification
              duplicateInfo={duplicateInfo}
              onView={() => {
                console.log('👁️ Botão OK clicado no modal de duplicata');
                toast({
                  title: "📋 Apólice Atualizada",
                  description: `A apólice ${duplicateInfo?.policyNumber} está disponível na sua lista de apólices.`,
                });
                setDuplicateInfo(null);
              }}
              onDismiss={() => {
                console.log('❌ Modal de duplicata fechado');
                setDuplicateInfo(null);
              }}
            />
          </div>
        </>
      )}

      <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <span>Upload de Apólices</span>
          </CardTitle>
          <CardDescription>
            Arraste seus PDFs de apólices aqui para extração automática dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading Screen - Componente único durante processamento */}
          {isProcessingBatch ? (
            <div className="py-12">
              <div className="max-w-md mx-auto text-center">
                <div className="mb-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processando Apólices
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {selectedFiles.length} arquivo(s) sendo processado(s) via n8n
                </p>
                
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    ⏱️ Tempo estimado: <strong>até 10 minutos</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    O tempo varia conforme a quantidade e complexidade dos arquivos
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm">📄</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Area */}
              <div
                {...getRootProps()} 
                className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
                  selectedFiles.length > 0 
                    ? 'border-gray-200 bg-gray-50/50 cursor-default'
                    : 'hover:bg-blue-50/50 border-gray-300 cursor-pointer hover:border-blue-400'
                } ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <input {...getInputProps()} multiple />
                <div className="text-center">
                  <FilePlus className={`h-10 w-10 mx-auto mb-4 ${
                    selectedFiles.length > 0 ? 'text-gray-400' : 'text-blue-500'
                  }`} />
                  <p className={`text-base font-medium mb-2 ${
                    selectedFiles.length > 0 ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} arquivo(s) selecionado(s)` 
                      : isDragActive 
                        ? 'Solte os arquivos aqui' 
                        : 'Arraste PDFs aqui ou clique'
                    }
                  </p>
                  {selectedFiles.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Máximo de 10 arquivos • Apenas PDF
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFiles.length} arquivo(s) pronto(s)
                    </p>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-gray-500 hover:text-red-600 underline"
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
                    {selectedFiles.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-blue-500 text-sm">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="ml-2 text-gray-400 hover:text-red-500 transition-colors text-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSendFiles}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-md"
                  >
                    <Cloud className="mr-2 h-5 w-5" />
                    Processar {selectedFiles.length} Arquivo(s)
                  </Button>
                </div>
              )}

              {/* File Status List - apenas quando não está processando */}
              {activeFiles.length > 0 && (
                <FileStatusList 
                  fileStatuses={fileStatuses} 
                  activeFiles={activeFiles} 
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
