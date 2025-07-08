
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

    console.log(`🚀 Iniciando upload de ${acceptedFiles.length} arquivo(s)`);
    setIsProcessingBatch(true);

    try {
      let processedCount = 0;
      
      if (acceptedFiles.length === 1) {
        // Processamento individual para um único arquivo
        console.log(`📤 Processamento individual: ${acceptedFiles[0].name}`);
        await fileProcessor.processFile(acceptedFiles[0]);
        processedCount = 1;
      } else {
        // Processamento em lote para múltiplos arquivos
        console.log(`📦 Processamento em lote: ${acceptedFiles.length} arquivos`);
        const results = await fileProcessor.processMultipleFiles(acceptedFiles);
        processedCount = results.length;
      }
      
      console.log(`🎉 Processamento concluído! ${processedCount} apólices processadas`);
      
      if (processedCount > 0) {
        toast({
          title: "🎉 Processamento Concluído",
          description: `${processedCount} apólice(s) foram processadas e adicionadas ao dashboard`,
        });
      } else {
        toast({
          title: "⚠️ Processamento Concluído",
          description: "Nenhuma apólice foi processada com sucesso",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      
      toast({
        title: "❌ Erro no Processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante o processamento dos arquivos",
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
            Sistema otimizado processa múltiplos PDFs simultaneamente para máxima eficiência.
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
                  ? 'Processamento em andamento...' 
                  : isDragActive 
                    ? 'Solte os arquivos aqui...' 
                    : 'Arraste e solte os PDFs ou clique para selecionar (máx. 10 arquivos)'
                }
              </p>
            </div>
          </div>

          <FileStatusList 
            fileStatuses={fileStatuses} 
            activeFiles={activeFiles} 
          />
        </CardContent>
        <CardFooter className="justify-between">
          {processingCount > 0 && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Clock className="h-4 w-4" />
              <span>{processingCount} arquivo(s) sendo processado(s)</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
