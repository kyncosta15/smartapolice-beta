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
  Settings
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { N8NFrotaWebhookService } from '@/services/n8nFrotaWebhook';

interface FrotasUploadProps {
  onSuccess: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  result?: {
    veiculosImportados: number;
    documentosAnexados: number;
    erros: string[];
  };
}

export function FrotasUpload({ onSuccess }: FrotasUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [useAI, setUseAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0 || !user?.company) return;

    setIsProcessing(true);
    
    try {
      // Atualizar todos os arquivos para uploading
      setFiles(prev => prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'uploading', progress: 20 }
          : f
      ));

      const filesToProcess = files
        .filter(f => f.status === 'uploading')
        .map(f => f.file);

      // Chamar webhook N8N
      setFiles(prev => prev.map(f => 
        f.status === 'uploading'
          ? { ...f, status: 'processing', progress: 60 }
          : f
      ));

      const result = await N8NFrotaWebhookService.processarDadosFrota(
        filesToProcess, 
        user.company
      );

      if (result.success) {
        // Atualizar status para completed
        setFiles(prev => prev.map(f => 
          f.status === 'processing'
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100, 
                result: {
                  veiculosImportados: result.data?.length || 0,
                  documentosAnexados: filesToProcess.length,
                  erros: []
                }
              }
            : f
        ));

        toast({
          title: "Processamento concluído",
          description: `${result.data?.length || 0} veículos importados com sucesso via N8N`,
        });
      } else {
        throw new Error(result.message || 'Erro no processamento');
      }

    } catch (error: any) {
      console.error('Erro ao processar arquivos:', error);
      
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' || f.status === 'processing'
          ? { ...f, status: 'error', progress: 0, error: error.message }
          : f
      ));

      toast({
        title: "Erro no processamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      onSuccess();
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
        return 'Aguardando';
      case 'uploading':
        return 'Enviando...';
      case 'processing':
        return useAI ? 'Processando com IA...' : 'Processando...';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
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
            Configurações de Processamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Usar Extração por IA (recomendado)</span>
              </div>
              <p className="text-sm text-gray-500">
                A IA irá extrair automaticamente os dados dos documentos PDF
              </p>
            </div>
            <Switch
              checked={useAI}
              onCheckedChange={setUseAI}
            />
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
                  Suporte para PDF, Excel (XLSX/XLS), CSV e imagens
                </p>
                <p className="text-xs text-gray-400">
                  Máximo 10 arquivos, 20MB cada
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
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Processar e Inserir
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
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
                        <p>
                          ✓ {fileItem.result.veiculosImportados} veículos importados, 
                          {fileItem.result.documentosAnexados} documentos anexados
                        </p>
                        {fileItem.result.erros.length > 0 && (
                          <p className="text-red-600 mt-1">
                            Avisos: {fileItem.result.erros.join(', ')}
                          </p>
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
            Como funciona a extração automática?
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <strong>PDFs:</strong> Extraímos automaticamente dados como placa, CNPJ/CPF, proprietário, marca/modelo, valores, etc.
            </p>
            <p>
              • <strong>Excel/CSV:</strong> Mapeamos as colunas automaticamente e permitimos ajustes manuais.
            </p>
            <p>
              • <strong>Imagens:</strong> Usamos OCR para extrair texto de documentos fotografados.
            </p>
            <p>
              • <strong>FIPE:</strong> Consultamos automaticamente o preço FIPE atual para cada veículo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}