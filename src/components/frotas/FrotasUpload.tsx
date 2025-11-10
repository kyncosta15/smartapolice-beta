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
  Brain
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { N8NUploadService, N8NUploadMetadata, N8NResponse } from '@/services/n8nUploadService';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileAndCompany } from '@/utils/profileUtils';
import { DuplicateVehiclesModal } from './DuplicateVehiclesModal';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [detectedDuplicates, setDetectedDuplicates] = useState<any[]>([]);
  const [pendingUploadData, setPendingUploadData] = useState<any>(null);

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

  const sendToWebhook = async (file: File, metadata: N8NUploadMetadata, fileId: string) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isPDF = fileExtension === 'pdf';
    const webhookUrl = isPDF 
      ? 'https://rcorpsolutions.app.n8n.cloud/webhook/pdf-frota'
      : 'https://rcorpsolutions.app.n8n.cloud/webhook-test/upload-arquivo';

    console.log(`📤 Enviando ${file.name} (${fileExtension?.toUpperCase()}) para webhook: ${isPDF ? 'PDF' : 'PLANILHA'}`);

    // Status: Uploading
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading', progress: 20 }
        : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Para webhook de planilhas, enviar campos separados
      if (!isPDF) {
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      } else {
        // Para webhook de PDF, enviar metadata como JSON
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Status: Processing
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 40 }
          : f
      ));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar para webhook ${isPDF ? 'PDF' : 'PLANILHA'}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ ${file.name} dados extraídos:`, result);
      console.log('📋 Tipo do resultado:', typeof result, 'É array?', Array.isArray(result));

      // Se for PDF, enviar os dados extraídos para o webhook de planilhas
      if (isPDF && result) {
        console.log('📤 PDF detectado, preparando para inserir dados...');
        
        // Verificar se result é um array ou objeto único
        const resultArray = Array.isArray(result) ? result : [result];
        console.log('📦 Resultado como array:', resultArray);
        
        if (resultArray.length > 0 && resultArray[0].veiculos) {
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'processing', progress: 70 }
              : f
          ));

          // Processar cada apólice/frota do resultado
          const apolice = resultArray[0];
          const dadosVeiculos = apolice.veiculos || [];
          console.log(`📊 Processando ${dadosVeiculos.length} veículos do PDF`);
          console.log('🔍 Primeiro veículo:', dadosVeiculos[0]);

          // Mapear dados do PDF para o formato esperado pelo webhook de planilhas
          const veiculosMapeados = dadosVeiculos.map((veiculo: any) => ({
            codigo: veiculo.item || veiculo.codigo,
            placa: veiculo.placa,
            chassi: veiculo.chassi,
            modelo: veiculo.modelo,
            marca: veiculo.marca,
            ano_modelo: veiculo.ano_modelo,
            familia: veiculo.categoria || veiculo.familia,
            localizacao: veiculo.localizacao || `${veiculo.cidade} - ${veiculo.uf}`,
            status: 'Ativo',
            // Dados adicionais da apólice
            seguradora: apolice.seguradora,
            numero_apolice: apolice.numero_cotacao || apolice.numero_apolice,
            valor_seguro: veiculo.coberturas?.['RCF-V'] || veiculo.valor_seguro || 0,
            franquia: veiculo.franquia || 0
          }));

          console.log('📦 Veículos mapeados para inserção:', veiculosMapeados);
          console.log('🏢 Empresa ID:', metadata.empresa_id);

          // Enviar para o webhook de inserção usando supabase edge function
          try {
            console.log('🚀 Invocando edge function processar-n8n-frotas...');
            
            const { data: insertResult, error: insertError } = await supabase.functions.invoke('processar-n8n-frotas', {
              body: {
                veiculos: veiculosMapeados,
                empresaId: metadata.empresa_id,
                userEmail: metadata.user_email
              }
            });

            if (insertError) {
              console.error('❌ Erro ao inserir dados extraídos:', insertError);
              throw insertError;
            } else {
              console.log('✅ Dados inseridos com sucesso:', insertResult);
            }
          } catch (funcError) {
            console.error('❌ Erro na chamada da edge function:', funcError);
            throw funcError;
          }
        } else {
          console.warn('⚠️ Nenhum veículo encontrado no resultado do PDF');
        }
      }

      // Status: Completed
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100, 
              result 
            }
          : f
      ));

      return result;
    } catch (error: any) {
      console.error(`Erro ao processar ${file.name}:`, error);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', progress: 0, error: error.message }
          : f
      ));

      throw error;
    }
  };

  const processFiles = async (overwriteDuplicates: boolean = false) => {
    if (files.length === 0) {
      toast({
        title: "Erro de configuração",
        description: "Nenhum arquivo selecionado para processamento",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado ou email não disponível",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Garantir que usuário tem perfil e empresa configurados
      const { user: authenticatedUser, empresa_id } = await ensureProfileAndCompany(supabase);
      
      // Buscar dados da empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', empresa_id)
        .single();

      // Preparar metadados
      const metadata: N8NUploadMetadata = {
        empresa_id,
        empresa_nome: empresa?.nome || 'Empresa',
        user_id: authenticatedUser.id,
        user_email: authenticatedUser.email,
        razao_social: empresa?.nome || 'Empresa',
        overwrite_duplicates: overwriteDuplicates
      };

      console.log('Metadata recebida:', metadata);

      // Processar cada arquivo com o webhook apropriado
      for (const fileItem of files) {
        if (fileItem.status !== 'pending') continue;

        try {
          const result = await sendToWebhook(fileItem.file, metadata, fileItem.id);

          // Verificar se há duplicatas detectadas
          if (result.duplicates && result.duplicates.length > 0) {
            console.log(`⚠️ ${result.duplicates.length} duplicatas detectadas:`, result.duplicates);
            
            setDetectedDuplicates(result.duplicates);
            setPendingUploadData({ fileItem, metadata });
            setDuplicatesModalOpen(true);
            setIsProcessing(false);
            return;
          }

          // Chamar função para preencher dados vazios após o processamento
          try {
            console.log('Chamando preenchimento de dados vazios...');
            
            const { data: preencherResult } = await supabase.functions.invoke('preencher-dados-veiculos', {
              body: { 
                empresaId: empresa_id,
                userEmail: authenticatedUser.email 
              }
            });
            
            console.log('Resultado do preenchimento:', preencherResult);
          } catch (error) {
            console.warn('Erro ao preencher dados vazios:', error);
          }

          toast({
            title: "✅ Arquivo processado",
            description: `${result.metrics?.totalVeiculos || result.detalhes?.total_recebidos || 0} veículos processados`,
          });

          // Forçar atualização do dashboard de frotas
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('frota-data-updated'));
          }, 1500);

        } catch (error: any) {
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

  const handleDuplicateConfirmation = async (shouldOverwrite: boolean) => {
    if (!pendingUploadData) return;

    setDuplicatesModalOpen(false);
    
    if (shouldOverwrite) {
      // Reprocessar com flag de sobrescrever
      await processFiles(true);
    } else {
      // Continuar sem sobrescrever
      toast({
        title: "Processamento cancelado",
        description: "Os dados existentes foram mantidos. Veículos duplicados não foram importados.",
      });
      setIsProcessing(false);
    }

    // Limpar estados
    setDetectedDuplicates([]);
    setPendingUploadData(null);
  };

  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-6">
      <DuplicateVehiclesModal
        isOpen={duplicatesModalOpen}
        onClose={() => {
          setDuplicatesModalOpen(false);
          setIsProcessing(false);
        }}
        duplicates={detectedDuplicates}
        onConfirm={handleDuplicateConfirmation}
        isProcessing={isProcessing}
      />

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Upload & Extração de Dados
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Faça upload de documentos PDF, planilhas Excel/CSV para importar dados da frota
        </p>
      </div>


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
                  onClick={() => processFiles(false)}
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  className="flex items-center gap-2"
                  size="default"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Processar Arquivos
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
              • <strong>Processamento automático:</strong> Dados extraídos com ajuda da IA
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