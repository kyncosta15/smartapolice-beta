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

  // Função que será chamada quando uma política for extraída, incluindo o arquivo
  const handlePolicyExtracted = useCallback((policy: ParsedPolicyData, file?: File) => {
    console.log(`📋 Política extraída com arquivo:`, { 
      policyName: policy.name, 
      hasFile: !!file,
      fileName: file?.name 
    });
    
    // Chamar a função original passando tanto a política quanto o arquivo
    onPolicyExtracted(policy, file);
  }, [onPolicyExtracted]);

  const fileProcessor = new FileProcessor(
    updateFileStatus,
    removeFileStatus,
    user?.id || null,
    handlePolicyExtracted, // Usar a função wrapper que inclui o arquivo
    toast
  );

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
    console.log(`📤 Iniciando processamento em lote de ${acceptedFiles.length} arquivo(s)`);
    console.log(`👤 User ID para processamento:`, user.id);
    console.log(`🔗 Webhook ativo: https://smartapoliceoficialbeta.app.n8n.cloud/webhook/upload-arquivo`);
    
    setIsProcessingBatch(true);

    try {
      console.log(`🚀 Chamando fileProcessor.processMultipleFiles...`);
      // Processar arquivos em lote (método otimizado)
      const allResults = await fileProcessor.processMultipleFiles(acceptedFiles);
      
      console.log(`🎉 Processamento completo! ${allResults.length} apólices extraídas`);
      
      toast({
        title: "🎉 Processamento em Lote Concluído",
        description: `${allResults.length} apólices foram processadas e salvas no banco de dados`,
      });

    } catch (error) {
      console.error('❌ Erro no processamento em lote:', error);
      
      toast({
        title: "Erro no Processamento em Lote",
        description: "Ocorreu um erro durante o processamento dos arquivos",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
    }

  }, [fileProcessor, toast, user?.id]);

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
            Arraste e solte os PDFs para processamento automático e salvamento no banco
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
                  ? 'Processamento e salvamento em andamento...' 
                  : isDragActive 
                    ? 'Solte os arquivos aqui...' 
                    : 'Arraste e solte os PDFs ou clique para selecionar (máx. 10 arquivos)'
                }
              </p>
              {isProcessingBatch && (
                <p className="text-xs text-blue-600 mt-2">
                  Processando e salvando no banco de dados...
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
