
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';
import { useFileStatusManager } from '@/hooks/useFileStatusManager';
import { FileProcessor } from '@/services/fileProcessor';
import { FileStatusList } from './FileStatusList';
import { EnhancedPDFUploadProps } from '@/types/pdfUpload';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordProtectedPDFModal } from './PasswordProtectedPDFModal';
import { usePDFPasswordHandler } from '@/hooks/usePDFPasswordHandler';

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

  const fileProcessor = new FileProcessor(
    updateFileStatus,
    removeFileStatus,
    user?.id || null,
    onPolicyExtracted,
    toast
  );

  // Handler para processar arquivos após desbloqueio (ou sem senha)
  const handleFileProcessed = useCallback(async (file: File, wasUnlocked: boolean) => {
    console.log(`📋 Arquivo processado para upload: ${file.name} (Desbloqueado: ${wasUnlocked})`);
    
    if (wasUnlocked) {
      toast({
        title: "🔓 PDF Desbloqueado",
        description: `${file.name} foi desbloqueado e será processado normalmente.`,
      });
    }

    // Processar o arquivo normalmente
    try {
      await fileProcessor.processFile(file);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "❌ Erro no Processamento",
        description: `Falha ao processar ${file.name}`,
        variant: "destructive",
      });
    }
  }, [fileProcessor, toast]);

  // Handler para arquivos rejeitados
  const handleFileRejected = useCallback((fileName: string, reason: string) => {
    console.error(`❌ Arquivo rejeitado: ${fileName} - ${reason}`);
    toast({
      title: "❌ Arquivo Rejeitado",
      description: `${fileName}: ${reason}`,
      variant: "destructive",
    });
  }, [toast]);

  // Hook para gerenciar PDFs protegidos por senha
  const {
    isModalOpen,
    currentFile,
    processFile: processPDFFile,
    handlePasswordSubmit,
    closeModal
  } = usePDFPasswordHandler({
    onFileProcessed: handleFileProcessed,
    onFileRejected: handleFileRejected
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro de Autenticação",
        description: "Usuário não autenticado. Faça login para continuar.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🚀 EnhancedPDFUpload.onDrop CHAMADO!`);
    console.log(`📤 Processando ${acceptedFiles.length} arquivo(s) com detecção de senha`);

    // Processar cada arquivo individualmente para detectar senhas
    for (const file of acceptedFiles) {
      console.log(`🔍 Verificando arquivo: ${file.name}`);
      await processPDFFile(file);
    }

  }, [processPDFFile, toast, user?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    multiple: true,
    disabled: isProcessingBatch || isModalOpen, // Desabilitar durante modal de senha
  });

  const activeFiles = getActiveFiles();
  const processingCount = getProcessingCount();

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <span>Upload de Apólices</span>
            {isModalOpen && <Lock className="h-4 w-4 text-orange-600" />}
          </CardTitle>
          <CardDescription>
            Sistema otimizado com detecção automática de PDFs protegidos por senha. Processa múltiplos arquivos simultaneamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            {...getRootProps()} 
            className={`relative border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors ${
              isProcessingBatch || isModalOpen
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                : 'hover:bg-gray-50 border-gray-300'
            } ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}
          >
            <input {...getInputProps()} multiple />
            <div className="text-center">
              <FilePlus className={`h-6 w-6 mx-auto mb-2 ${isProcessingBatch || isModalOpen ? 'text-gray-400' : 'text-gray-400'}`} />
              <p className={`text-sm ${isProcessingBatch || isModalOpen ? 'text-gray-400' : 'text-gray-500'}`}>
                {isModalOpen 
                  ? 'Aguardando desbloqueio de PDF protegido...' 
                  : isProcessingBatch 
                    ? 'Processamento em lote em andamento...' 
                    : isDragActive 
                      ? 'Solte os arquivos aqui...' 
                      : 'Arraste e solte os PDFs ou clique para selecionar (máx. 10 arquivos)'
                }
              </p>
              {isModalOpen && (
                <p className="text-xs text-orange-600 mt-1">
                  🔒 PDF protegido detectado - inserir senha para continuar
                </p>
              )}
            </div>
          </div>

          <FileStatusList 
            fileStatuses={fileStatuses} 
            activeFiles={activeFiles} 
          />
        </CardContent>
        <CardFooter className="justify-between">
          {processingCount > 0 && (
            <div className="text-sm text-gray-600">
              Processando {processingCount} arquivo(s)...
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Modal para solicitar senha de PDFs protegidos */}
      <PasswordProtectedPDFModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onPasswordSubmit={handlePasswordSubmit}
        fileName={currentFile?.name || ''}
        maxAttempts={3}
      />
    </div>
  );
}
