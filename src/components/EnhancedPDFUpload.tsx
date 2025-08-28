
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Cloud, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';
import { useFileStatusManager } from '@/hooks/useFileStatusManager';
import { FileStatusList } from './FileStatusList';
import { EnhancedPDFUploadProps } from '@/types/pdfUpload';
import { useAuth } from '@/contexts/AuthContext';
import { N8NWebhookService } from '@/services/n8nWebhookService';

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
      const allResults: ParsedPolicyData[] = [];

      // Processar cada arquivo individualmente via webhook N8N
      for (const file of acceptedFiles) {
        const fileName = file.name;
        
        // Atualizar status inicial
        updateFileStatus(fileName, {
          progress: 10,
          status: 'uploading',
          message: 'Enviando para webhook N8N...'
        });

        try {
          console.log(`📤 Enviando ${fileName} para webhook N8N...`);
          
          // Atualizar para processamento
          updateFileStatus(fileName, {
            progress: 30,
            status: 'processing',
            message: 'Processando via N8N webhook...'
          });

          // CHAMAR DIRETAMENTE O WEBHOOK N8N
          const webhookResult = await N8NWebhookService.processarPdfComN8n(file, user.id);
          
          if (webhookResult.success && webhookResult.policies && webhookResult.policies.length > 0) {
            console.log(`✅ Webhook N8N processou ${fileName}: ${webhookResult.policies.length} políticas`);
            
            // Atualizar progresso
            updateFileStatus(fileName, {
              progress: 80,
              status: 'processing',
              message: 'Salvando políticas extraídas...'
            });

            // Adicionar políticas aos resultados
            allResults.push(...webhookResult.policies);

            // Notificar políticas extraídas individualmente
            webhookResult.policies.forEach(policy => {
              onPolicyExtracted(policy);
            });

            // Atualizar para concluído
            updateFileStatus(fileName, {
              progress: 100,
              status: 'completed',
              message: `✅ ${webhookResult.policies.length} políticas extraídas`
            });

            toast({
              title: "✅ Arquivo Processado",
              description: `${fileName}: ${webhookResult.policies.length} apólices extraídas via N8N`,
            });

          } else {
            console.warn(`⚠️ Webhook N8N não retornou políticas para ${fileName}`);
            
            updateFileStatus(fileName, {
              progress: 100,
              status: 'failed',
              message: 'Nenhuma apólice foi extraída'
            });

            toast({
              title: "⚠️ Nenhuma Política Extraída",
              description: `Arquivo ${fileName} foi processado mas não gerou apólices`,
              variant: "destructive",
            });
          }

        } catch (fileError) {
          console.error(`❌ Erro processando ${fileName}:`, fileError);
          
          updateFileStatus(fileName, {
            progress: 100,
            status: 'failed',
            message: `Erro: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`
          });

          toast({
            title: "❌ Erro no Arquivo",
            description: `Falha ao processar ${fileName}: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`,
            variant: "destructive",
          });
        }

        // Delay entre arquivos para não sobrecarregar
        if (acceptedFiles.indexOf(file) < acceptedFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`🎉 Processamento completo! ${allResults.length} apólices extraídas no total`);
      
      if (allResults.length > 0) {
        toast({
          title: "🎉 Upload Processado com Sucesso",
          description: `${allResults.length} apólices foram extraídas via N8N webhook e salvas`,
        });
      } else {
        toast({
          title: "⚠️ Nenhuma Apólice Extraída",
          description: "Os arquivos foram enviados para o N8N mas nenhuma apólice foi extraída.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro no processamento via N8N webhook:', error);
      
      toast({
        title: "❌ Erro no Webhook N8N",
        description: error instanceof Error ? error.message : "Erro desconhecido no webhook N8N",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBatch(false);
    }

  }, [toast, user?.id, onPolicyExtracted, updateFileStatus]);

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
            <span>Upload de Apólices via N8N</span>
          </CardTitle>
          <CardDescription>
            Envie seus PDFs para processamento automático via webhook N8N
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
                  ? 'Enviando para webhook N8N...' 
                  : isDragActive 
                    ? 'Solte os arquivos aqui para enviar ao N8N...' 
                    : 'Arraste PDFs ou clique para enviar ao webhook N8N (máx. 10 arquivos)'
                }
              </p>
              {isProcessingBatch && (
                <p className="text-xs text-blue-600 mt-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Processando via N8N webhook...
                </p>
              )}
              {processingCount > 0 && !isProcessingBatch && (
                <p className="text-xs text-orange-600 mt-2">
                  {processingCount} arquivo(s) sendo processado(s) via N8N
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
