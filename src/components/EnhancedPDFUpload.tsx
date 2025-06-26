
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

    // Processar arquivos em paralelo
    const processingPromises = acceptedFiles.map(file => fileProcessor.processFile(file));
    await Promise.allSettled(processingPromises);

  }, [fileProcessor]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 5,
  });

  const activeFiles = getActiveFiles();
  const processingCount = getProcessingCount();

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload de Apólices - Extração Inteligente com IA</CardTitle>
          <CardDescription>
            Arraste e solte os arquivos PDF ou clique para selecionar.
            A IA vai extrair automaticamente os dados das apólices com base no modelo avançado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className="relative border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <input {...getInputProps()} />
            <div className="text-center">
              <FilePlus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste e solte os arquivos PDF ou clique para selecionar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                IA local extrai dados detalhados automaticamente
              </p>
            </div>
          </div>

          <FileStatusList 
            fileStatuses={fileStatuses} 
            activeFiles={activeFiles} 
          />
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Extração local com IA avançada</p>
            <p>• Suporte a dados detalhados de veículos, segurados e coberturas</p>
          </div>
          {processingCount > 0 && (
            <div className="text-right">
              <p className="text-sm text-blue-600 font-medium">
                Processando {processingCount} arquivo(s)...
              </p>
              <p className="text-xs text-gray-500">Extraindo dados com IA local</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
