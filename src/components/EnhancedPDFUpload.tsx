
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';
import { useFileStatusManager } from '@/hooks/useFileStatusManager';
import { FileProcessor } from '@/services/fileProcessor';
import { FileStatusList } from './FileStatusList';
import { EnhancedPDFUploadProps } from '@/types/pdfUpload';
import { useAuth } from '@/contexts/AuthContext';

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    if (!user?.id) {
      toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado. Faça login para continuar.",
        variant: "destructive",
      });
      return;
    }

    console.log(`🚀 EnhancedPDFUpload.onDrop INICIADO!`);
    console.log(`📤 Processando ${acceptedFiles.length} arquivo(s) para usuário: ${user.id}`);
    console.log(`🔗 Webhook N8N: https://smartapolicetest.app.n8n.cloud/webhook/upload-arquivo`);
    
    setIsProcessingBatch(true);

    try {
      // Processar arquivos via webhook N8N
      console.log(`🚀 Chamando fileProcessor.processMultipleFiles...`);
      const allResults = await fileProcessor.processMultipleFiles(acceptedFiles);
      
      console.log(`🎉 Processamento concluído! ${allResults.length} apólices extraídas`);
      
      if (allResults.length > 0) {
        toast({
          title: "🎉 Upload Processado com Sucesso",
          description: `${allResults.length} apólices foram extraídas e salvas no banco de dados`,
        });
      } else {
        toast({
          title: "⚠️ Nenhuma Apólice Extraída",
          description: "Os arquivos foram processados mas nenhuma apólice foi extraída.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      
      toast({
        title: "❌ Erro no Processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido durante o processamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
    }

  }, [fileProcessor, toast, user?.id, onPolicyExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
    multiple: true,
    disabled: isProcessingBatch,
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
          </CardTitle>
          <CardDescription>
            Envie seus PDFs de apólices para extração automática via N8N
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
                  ? 'Processamento via webhook N8N em andamento...' 
                  : isDragActive 
                    ? 'Solte os arquivos aqui...' 
                    : 'Arraste e solte os PDFs ou clique para selecionar (máx. 10 arquivos)'
                }
              </p>
              {isProcessingBatch && (
                <p className="text-xs text-blue-600 mt-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Enviando para processamento inteligente...
                </p>
              )}
              {processingCount > 0 && !isProcessingBatch && (
                <p className="text-xs text-orange-600 mt-2">
                  {processingCount} arquivo(s) sendo processado(s)
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
  );
}
