
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

export function EnhancedPDFUpload({ onPolicyExtracted }: EnhancedPDFUploadProps) {
  const { 
    fileStatuses, 
    updateFileStatus, 
    removeFileStatus, 
    getActiveFiles, 
    getProcessingCount 
  } = useFileStatusManager();
  
  const { toast } = useToast();
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const fileProcessor = new FileProcessor(
    updateFileStatus,
    removeFileStatus,
    null, // fetchPolicyData não é mais necessário
    onPolicyExtracted,
    toast
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    console.log(`📤 Processando lote de ${acceptedFiles.length} arquivo(s) sequencialmente`);
    setIsProcessingBatch(true);

    try {
      // Processar arquivos sequencialmente e aguardar todos os resultados
      await fileProcessor.processMultipleFiles(acceptedFiles);
      
      toast({
        title: "🎉 Lote Processado",
        description: `Todos os ${acceptedFiles.length} arquivos foram processados e adicionados ao dashboard`,
      });

    } catch (error) {
      console.error('❌ Erro no processamento do lote:', error);
      
      toast({
        title: "Erro no Lote",
        description: "Ocorreu um erro durante o processamento do lote de arquivos",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
    }

  }, [fileProcessor, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
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
            {isProcessingBatch && (
              <div className="flex items-center space-x-2 ml-4">
                <Clock className="h-4 w-4 text-orange-500 animate-pulse" />
                <span className="text-sm text-orange-600 font-medium">Processando lote...</span>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Sistema inteligente processa PDFs de forma sequencial e atualiza o dashboard após processamento completo.
            {isProcessingBatch && (
              <div className="mt-2 text-sm text-orange-600">
                ⏳ Aguarde o processamento completo de todos os arquivos antes de adicionar novos.
              </div>
            )}
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
            <input {...getInputProps()} />
            <div className="text-center">
              <FilePlus className={`h-6 w-6 mx-auto mb-2 ${isProcessingBatch ? 'text-gray-400' : 'text-gray-400'}`} />
              <p className={`text-sm ${isProcessingBatch ? 'text-gray-400' : 'text-gray-500'}`}>
                {isProcessingBatch 
                  ? 'Processando lote atual...' 
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
            <div className="text-right">
              <p className="text-sm text-blue-600 font-medium">
                Processando {processingCount} arquivo(s)...
              </p>
            </div>
          )}
          
          {isProcessingBatch && (
            <div className="text-right">
              <p className="text-sm text-orange-600 font-medium">
                🔄 Processamento sequencial em andamento...
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
