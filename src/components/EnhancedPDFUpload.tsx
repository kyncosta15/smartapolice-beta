
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

export function EnhancedPDFUpload({ onPolicyExtracted, onUploadComplete }: EnhancedPDFUploadProps) {
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

      if (allResults.length > 0) {
        toast({
          title: "🎉 Upload Concluído com Sucesso",
          description: `${allResults.length} apólice(s) foram processadas e salvas no seu perfil`,
        });
        setSelectedFiles([]); // Limpar arquivos após sucesso

        try {
          await onUploadComplete?.({ policies: allResults });
        } catch (callbackError) {
          console.error('❌ Erro ao concluir fluxo pós-upload:', callbackError);
        }
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
  }, [selectedFiles, toast, user?.id, user?.email, updateFileStatus, removeFileStatus, onPolicyExtracted, onUploadComplete]);

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
            <div className="py-10">
              <div className="max-w-lg mx-auto">
                {/* Spinner + Status */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-[3px] border-muted rounded-full"></div>
                    <div className="absolute inset-0 border-[3px] border-primary rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Processando {selectedFiles.length} {selectedFiles.length === 1 ? 'arquivo' : 'arquivos'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Estimativa: até 10 min
                  </p>
                </div>

                {/* File list compacta */}
                <div className="space-y-1.5">
                  {selectedFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border border-border rounded-lg"
                    >
                      <FilePlus className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
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
                    ? 'border-border bg-muted/30 cursor-default'
                    : 'hover:bg-accent/50 border-border cursor-pointer hover:border-primary/50'
                } ${isDragActive ? 'border-primary bg-primary/5' : ''}`}
              >
                <input {...getInputProps()} multiple />
                <div className="text-center">
                  <FilePlus className={`h-10 w-10 mx-auto mb-4 ${
                    selectedFiles.length > 0 ? 'text-muted-foreground' : 'text-primary'
                  }`} />
                  <p className={`text-base font-medium mb-2 text-foreground`}>
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} arquivo(s) selecionado(s)` 
                      : isDragActive 
                        ? 'Solte os arquivos aqui' 
                        : 'Arraste PDFs aqui ou clique'
                    }
                  </p>
                  {selectedFiles.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Máximo de 10 arquivos • Apenas PDF
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-foreground">
                      {selectedFiles.length} arquivo(s) pronto(s)
                    </p>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-muted-foreground hover:text-destructive underline"
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1.5 bg-muted/30 rounded-lg p-3">
                    {selectedFiles.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 px-3 py-2 bg-background rounded-md border border-border"
                      >
                        <FilePlus className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {file.name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none"
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
