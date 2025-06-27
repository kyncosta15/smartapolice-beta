
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud } from 'lucide-react';
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

    console.log(`📤 Processando ${acceptedFiles.length} arquivo(s) com N8N + IA`);

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
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-blue-600" />
            <span>Upload de Apólices - Processamento N8N + IA</span>
          </CardTitle>
          <CardDescription>
            Sistema inteligente integrado ao N8N que processa PDFs de forma assíncrona e extrai dados específicos por seguradora.
            Suporte para Liberty, Bradesco, Porto Seguro e outras seguradoras.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className="relative border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <input {...getInputProps()} />
            <div className="text-center">
              <FilePlus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste e solte os PDFs ou clique para selecionar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Processamento via N8N com fallback local
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
            <p>• Processamento assíncrono via webhook N8N</p>
            <p>• Extração contextualizada por layout específico</p>
            <p>• Fallback automático para processamento local</p>
            <p>• Validação e preenchimento inteligente de dados</p>
          </div>
          {processingCount > 0 && (
            <div className="text-right">
              <p className="text-sm text-blue-600 font-medium">
                Processando {processingCount} arquivo(s)...
              </p>
              <p className="text-xs text-gray-500">N8N + IA em andamento</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
