import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { FilePlus, File, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { usePolicyDataFetch } from '@/hooks/usePolicyDataFetch';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: ParsedPolicyData) => void;
}

interface FileProcessingStatus {
  [fileName: string]: {
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message: string;
  };
}

export function EnhancedPDFUpload({ onPolicyExtracted }: EnhancedPDFUploadProps) {
  const [fileStatuses, setFileStatuses] = useState<FileProcessingStatus>({});
  const { fetchPolicyData, isLoading } = usePolicyDataFetch();
  const { toast } = useToast();

  // Webhook n8n URL
  const N8N_WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';

  const updateFileStatus = (fileName: string, update: Partial<FileProcessingStatus[string]>) => {
    setFileStatuses(prev => ({
      ...prev,
      [fileName]: { ...prev[fileName], ...update }
    }));
  };

  const triggerN8NWebhook = async (fileName: string, file: File) => {
    try {
      console.log('🚀 Enviando arquivo para n8n via multipart/form-data:', fileName);
      
      // Criar FormData para envio multipart
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('fileSize', file.size.toString());
      formData.append('fileType', file.type);
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'SmartApólice');
      formData.append('event', 'pdf_uploaded');

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData, // FormData automaticamente define multipart/form-data
      });

      if (response.ok) {
        console.log('✅ Webhook n8n executado com sucesso para:', fileName);
        return true;
      } else {
        console.error('❌ Erro HTTP no webhook n8n:', response.status, response.statusText);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao executar webhook n8n:', error);
      return false;
    }
  };

  const processFile = async (file: File) => {
    const fileName = file.name;
    
    // Inicializar status do arquivo
    updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Enviando arquivo...'
    });

    try {
      // 1. Simular upload progress
      for (let progress = 0; progress <= 50; progress += 25) {
        updateFileStatus(fileName, { progress });
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // 2. Trigger webhook n8n com multipart/form-data
      updateFileStatus(fileName, {
        progress: 75,
        status: 'uploading',
        message: 'Enviando PDF para análise da IA...'
      });

      const webhookSuccess = await triggerN8NWebhook(fileName, file);
      
      if (!webhookSuccess) {
        throw new Error('Falha ao comunicar com o workflow de extração');
      }

      // 3. Aguardar processamento via polling
      updateFileStatus(fileName, {
        progress: 100,
        status: 'processing',
        message: 'IA analisando documento. Aguarde...'
      });

      const result = await fetchPolicyData({
        fileName,
        maxRetries: 8,
        retryInterval: 2500
      });

      if (result.success && result.data) {
        // 4. Sucesso
        updateFileStatus(fileName, {
          progress: 100,
          status: 'completed',
          message: `✅ Processado: ${result.data.insurer} - ${result.data.type}`
        });

        onPolicyExtracted(result.data);

        toast({
          title: "🎉 Apólice Extraída",
          description: `${result.data.name} processada com sucesso`,
        });

        // Remover da lista após 3 segundos
        setTimeout(() => {
          setFileStatuses(prev => {
            const { [fileName]: removed, ...rest } = prev;
            return rest;
          });
        }, 3000);

      } else {
        throw new Error(result.error || 'Falha no processamento');
      }

    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      
      updateFileStatus(fileName, {
        progress: 100,
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });

      toast({
        title: "Erro no Processamento",
        description: `Falha ao processar ${fileName}`,
        variant: "destructive",
      });

      // Remover após 5 segundos em caso de erro
      setTimeout(() => {
        setFileStatuses(prev => {
          const { [fileName]: removed, ...rest } = prev;
          return rest;
        });
      }, 5000);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    // Processar arquivos em paralelo
    const processingPromises = acceptedFiles.map(file => processFile(file));
    await Promise.allSettled(processingPromises);

  }, [onPolicyExtracted, fetchPolicyData, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 5,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const activeFiles = Object.keys(fileStatuses);
  const processingCount = activeFiles.filter(fileName => 
    ['uploading', 'processing'].includes(fileStatuses[fileName].status)
  ).length;

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload de Apólices - Extração Inteligente com IA</CardTitle>
          <CardDescription>
            Arraste e solte os arquivos PDF ou clique para selecionar.
            <br />
            <span className="text-xs text-blue-600">🤖 IA extrai dados automaticamente via n8n</span>
            <br />
            <span className="text-xs text-green-600">⚡ Upload multipart/form-data</span>
            <br />
            <span className="text-xs text-purple-600">📊 Dashboard atualizado automaticamente</span>
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
                IA vai extrair os dados automaticamente
              </p>
            </div>
          </div>

          {activeFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">
                Status do Processamento ({activeFiles.length})
              </h4>
              
              {activeFiles.map((fileName) => {
                const fileStatus = fileStatuses[fileName];
                return (
                  <div key={fileName} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fileStatus.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fileName}</p>
                          <p className="text-xs text-gray-500">{fileStatus.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{fileStatus.progress}%</p>
                      </div>
                    </div>
                    <Progress value={fileStatus.progress} className="mt-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-xs text-gray-500 space-y-1">
            <p>🔄 Upload multipart/form-data</p>
            <p>📊 Dados sincronizados em tempo real</p>
            <p>⚡ Polling inteligente até completar</p>
          </div>
          {processingCount > 0 && (
            <div className="text-right">
              <p className="text-sm text-blue-600 font-medium">
                Processando {processingCount} arquivo(s)...
              </p>
              <p className="text-xs text-gray-500">Aguarde a extração da IA</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
