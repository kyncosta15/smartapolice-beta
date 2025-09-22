import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Brain,
  Settings,
  TestTube,
  Rocket
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { N8NUploadService, N8NUploadMetadata, N8NResponse } from '@/services/n8nUploadService';
import { supabase } from '@/integrations/supabase/client';

interface FrotasUploadProps {
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: N8NResponse;
}

export function FrotasUpload({ onSuccess }: FrotasUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeEmpresaId, activeEmpresaName } = useTenant();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles: UploadFile[] = [];
    
    acceptedFiles.forEach((file) => {
      const validation = N8NUploadService.validateFile(file);
      
      if (validation.valid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
          progress: 0,
        });
      } else {
        toast({
          title: "Arquivo rejeitado",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 5,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0 || !activeEmpresaId || !activeEmpresaName) {
      toast({
        title: "Erro de configuração",
        description: "Empresa ativa não encontrada ou arquivo não selecionado",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Preparar metadados da empresa ativa
      const metadata: N8NUploadMetadata = {
        empresa_id: activeEmpresaId,
        empresa_nome: activeEmpresaName,
        user_id: user!.id,
        razao_social: activeEmpresaName,
      };

      // Processar cada arquivo individualmente
      for (const fileItem of files) {
        if (fileItem.status !== 'pending') continue;

        try {
          // Status: Uploading
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'uploading', progress: 20 }
              : f
          ));

          await new Promise(resolve => setTimeout(resolve, 800));

          // Status: Processing
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'processing', progress: 60 }
              : f
          ));

          console.log(`Processando arquivo: ${fileItem.file.name} no ambiente ${environment}`);
          
          const result = await N8NUploadService.uploadToN8N(
            fileItem.file,
            metadata,
            environment
          );

          // Status: Completed
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100, 
                  result 
                }
              : f
          ));

          // Chamar função para preencher dados vazios após o processamento
          try {
            console.log('Chamando preenchimento de dados vazios...');
            
            if (activeEmpresaId) {
              const { data: preencherResult } = await supabase.functions.invoke('preencher-dados-veiculos', {
                body: { empresaId: activeEmpresaId }
              });
              
              console.log('Resultado do preenchimento:', preencherResult);
            }
          } catch (error) {
            console.warn('Erro ao preencher dados vazios:', error);
          }

          toast({
            title: "✅ Arquivo processado",
            description: `${result.metrics?.totalVeiculos || 0} veículos processados${result.detalhes?.dados_preenchidos ? ` e ${result.detalhes.dados_preenchidos} campos vazios preenchidos automaticamente` : ''}`,
          });

          // Forçar atualização do dashboard de frotas
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('frota-data-updated'));
          }, 1500);

        } catch (error: any) {
          console.error(`Erro ao processar ${fileItem.file.name}:`, error);
          
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'error', progress: 0, error: error.message }
              : f
          ));

          toast({
            title: "❌ Erro no processamento",
            description: `${fileItem.file.name}: ${error.message}`,
            variant: "destructive",
          });
        }
      }

      // Aguardar um pouco antes de chamar onSuccess
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error: any) {
      console.error('Erro geral no processamento:', error);
      
      toast({
        title: "❌ Erro no processamento",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-600" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else if (file.type.includes('sheet') || file.type.includes('csv')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    }
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando processamento';
      case 'uploading':
        return 'Enviando para N8N...';
      case 'processing':
        return 'N8N processando arquivo...';
      case 'completed':
        return 'Processado com sucesso';
      case 'error':
        return 'Erro no processamento';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Upload & Extração de Dados
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Faça upload de documentos PDF, planilhas Excel/CSV para importar dados da frota
        </p>
      </div>

      {/* Configurações */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Configurações de Upload N8N
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {environment === 'test' ? (
                  <TestTube className="h-4 w-4 text-orange-600" />
                ) : (
                  <Rocket className="h-4 w-4 text-green-600" />
                )}
                <span className="font-medium">Ambiente N8N</span>
              </div>
              <p className="text-sm text-gray-500">
                {environment === 'test' 
                  ? 'Modo de teste - usar quando estiver "Listen for test event" no N8N'
                  : 'Modo produção - usar com fluxo publicado no N8N'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${environment === 'test' ? 'text-orange-600' : 'text-gray-500'}`}>
                Test
              </span>
              <Switch
                checked={environment === 'production'}
                onCheckedChange={(checked) => setEnvironment(checked ? 'production' : 'test')}
              />
              <span className={`text-sm ${environment === 'production' ? 'text-green-600' : 'text-gray-500'}`}>
                Prod
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
            <strong>URL atual:</strong> {environment === 'test' 
              ? 'webhook-test/testewebhook1' 
              : 'webhook/testewebhook1'
            }
          </div>

          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
            <strong>💾 Auto-save:</strong> Os dados processados serão automaticamente salvos no dashboard de frotas
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600 mb-2">
                  Solte os arquivos aqui
                </p>
                <p className="text-sm text-blue-500">
                  Os arquivos serão adicionados à lista de processamento
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Suporte para XLSX, CSV e PDF (máximo 20MB cada)
                </p>
                <p className="text-xs text-gray-400">
                  Máximo 5 arquivos, 20MB cada
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arquivos para Processamento ({files.length})
              </CardTitle>
              
                <Button
                  onClick={processFiles}
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  className="flex items-center gap-2"
                  size="default"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enviando para N8N ({environment})...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Processar no N8N
                    </>
                  )}
                </Button>
            </div>
            
            {totalFiles > 0 && (
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total: {totalFiles}</span>
                <span className="text-green-600">Concluídos: {completedFiles}</span>
                {errorFiles > 0 && (
                  <span className="text-red-600">Erros: {errorFiles}</span>
                )}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  {getFileIcon(fileItem.file)}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {fileItem.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileItem.file.size)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fileItem.status)}
                        <span className="text-sm text-gray-600">
                          {getStatusText(fileItem.status)}
                        </span>
                        
                        {fileItem.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileItem.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {fileItem.status !== 'pending' && (
                      <Progress value={fileItem.progress} className="w-full" />
                    )}
                    
                    {fileItem.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                        {fileItem.error}
                      </div>
                    )}
                    
                    {fileItem.result && (
                      <div className="text-sm text-green-600 bg-green-50 p-3 rounded border space-y-2">
                        <div className="font-semibold">📊 Resultado do Processamento:</div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Total de Veículos:</span>
                            <div className="text-lg font-bold text-green-700">
                              {fileItem.result.metrics?.totalVeiculos || 0}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Total de Linhas:</span>
                            <div className="text-lg font-bold text-blue-700">
                              {fileItem.result.metrics?.totalLinhas || 0}
                            </div>
                          </div>
                        </div>
                        
                        {fileItem.result.metrics?.porFamilia && (
                          <div>
                            <span className="font-medium">Por Família:</span>
                            <div className="mt-1 space-y-1">
                              {Object.entries(fileItem.result.metrics.porFamilia)
                                .slice(0, 3)
                                .map(([familia, count]) => (
                                <div key={familia} className="flex justify-between text-xs">
                                  <span className="truncate">{familia}:</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {fileItem.result.metrics?.processadoEm && (
                          <div className="text-xs text-gray-600">
                            Processado em: {fileItem.result.metrics.processadoEm}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            🚗 Gestão de Frotas Integrada
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>Processamento automático:</strong> Dados extraídos pelo N8N são salvos diretamente no Supabase
            </p>
            <p>
              • <strong>Dashboard atualizado:</strong> Após o processamento, os dados aparecem imediatamente no painel
            </p>
            <p>
              • <strong>Estrutura completa:</strong> Veículos, responsáveis e pagamentos são organizados automaticamente
            </p>
            <p>
              • <strong>Empresas vinculadas:</strong> Dados são associados à sua empresa no sistema
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}