
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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

    console.log(`🚀 EnhancedPDFUpload.onDrop INICIADO!`);
    console.log(`📤 Processando ${acceptedFiles.length} arquivo(s)`);
    console.log(`👤 User ID autenticado:`, user.id);
    console.log(`📧 User email:`, user.email);
    
    setIsProcessingBatch(true);

    try {
      // Criar FileProcessor com userId válido e callback de duplicatas
      const fileProcessor = new FileProcessor(
        updateFileStatus,
        removeFileStatus,
        user.id, // GARANTIR que userId seja passado
        onPolicyExtracted,
        toast,
        (info) => {
          // Callback quando duplicata é detectada
          console.log('🔔 CALLBACK DE DUPLICATA CHAMADO NO ENHANCED PDF UPLOAD!');
          console.log('📋 Info recebida:', info);
          console.log('📋 Setando duplicateInfo no state...');
          setDuplicateInfo(info);
          console.log('✅ duplicateInfo setado!');
        }
      );

      console.log(`🚀 Chamando fileProcessor.processMultipleFiles com userId: ${user.id}`);
      console.log(`🎯 Callback onDuplicateDetected foi fornecido:`, !!fileProcessor);
      
      // Processar arquivos em lote
      const allResults = await fileProcessor.processMultipleFiles(acceptedFiles, user.email);
      
      console.log(`🎉 Processamento completo! ${allResults.length} apólices extraídas e salvas`);
      
      // Sempre notificar o componente pai para recarregar os dados
      allResults.forEach(policy => {
        onPolicyExtracted(policy);
      });
      
      if (allResults.length > 0) {
        toast({
          title: "🎉 Upload Concluído com Sucesso",
          description: `${allResults.length} apólice(s) foram processadas e salvas no seu perfil`,
        });
      } else {
        toast({
          title: "⚠️ Nenhuma Apólice Processada",
          description: "Não foi possível extrair dados dos arquivos enviados. Verifique se são PDFs válidos de apólices.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro DETALHADO no processamento em lote:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no processamento';
      
      toast({
        title: "❌ Erro no Processamento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
      console.log('🏁 Processamento finalizado');
    }

  }, [toast, user?.id, updateFileStatus, removeFileStatus, onPolicyExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    multiple: true,
    disabled: isProcessingBatch || !user?.id, // Desabilitar se não autenticado
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
          <div
            {...getRootProps()} 
            className={`relative border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors ${
              isProcessingBatch 
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                : 'hover:bg-gray-50 border-gray-300'
            } ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            <input {...getInputProps()} multiple />
            <div className="text-center">
              <FilePlus className={`h-6 w-6 mx-auto mb-2 ${isProcessingBatch ? 'text-gray-400' : 'text-gray-400'}`} />
              <p className={`text-sm ${isProcessingBatch ? 'text-gray-400' : 'text-gray-500'}`}>
                {isProcessingBatch 
                  ? 'Processamento via IA em andamento...' 
                  : isDragActive 
                    ? 'Solte os arquivos aqui...' 
                    : 'Arraste e solte os PDFs ou clique para selecionar (máx. 10 arquivos)'
                }
              </p>
              {isProcessingBatch && (
                <p className="text-xs text-blue-600 mt-2">
                  Extraindo dados e salvando no seu perfil...
                </p>
              )}
            </div>
          </div>

          <FileStatusList 
            fileStatuses={fileStatuses} 
            activeFiles={activeFiles} 
          />
        </CardContent>
      </Card>
    </div>
    </>
  );
}
