
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Eye,
  Trash2,
  Webhook,
  RefreshCw,
  FileCheck,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedPolicyData {
  id: string;
  name: string;
  type: string;
  insurer: string;
  policyNumber: string;
  premium: string;
  startDate: string;
  endDate: string;
  coverage: string;
  paymentForm: string;
  installments: number;
  monthlyAmount: string;
  fileName: string;
  extractedAt: string;
  confidence: number;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: ExtractedPolicyData;
  error?: string;
}

interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: ExtractedPolicyData) => void;
}

const N8N_WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';

export const EnhancedPDFUpload = ({ onPolicyExtracted }: EnhancedPDFUploadProps) => {
  const [fileUploads, setFileUploads] = useState<FileUploadStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5; // Máximo de arquivos por vez

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato não suportado. Use PDF, JPG ou PNG.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    
    const isDuplicate = fileUploads.some(upload => 
      upload.file.name === file.name && upload.file.size === file.size
    );
    
    if (isDuplicate) {
      return 'Arquivo já foi adicionado.';
    }
    
    return null;
  };

  const sendToN8N = async (file: File, extractedData: ExtractedPolicyData) => {
    try {
      console.log('Enviando arquivo para n8n webhook:', file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('extractedData', JSON.stringify(extractedData));
      formData.append('timestamp', new Date().toISOString());
      formData.append('userId', 'user-123'); // ID do usuário atual
      formData.append('source', 'smart-apolice');

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Request-Source': 'SmartApolice',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Resposta do n8n:', result);
        
        toast({
          title: "Webhook Executado",
          description: `Arquivo ${file.name} processado e enviado para n8n com sucesso`,
        });
        
        return result;
      } else {
        console.error('Erro ao enviar para n8n:', response.status, response.statusText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na requisição para n8n:', error);
      toast({
        title: "Erro no Webhook",
        description: `Falha ao enviar ${file.name} para n8n: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const simulateAIExtraction = async (file: File): Promise<ExtractedPolicyData> => {
    const isImage = file.type.startsWith('image/');
    const extractionTime = isImage ? 3000 + Math.random() * 2000 : 2000 + Math.random() * 3000;
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.92) { // 92% de sucesso
          const mockData: ExtractedPolicyData = {
            id: `extracted-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: `Apólice ${file.name.replace(/\.(pdf|jpg|jpeg|png)$/i, '')}`,
            type: ['auto', 'vida', 'saude', 'empresarial', 'patrimonial'][Math.floor(Math.random() * 5)],
            insurer: ['Porto Seguro', 'SulAmérica', 'Bradesco Seguros', 'Allianz', 'Mapfre', 'Tokio Marine'][Math.floor(Math.random() * 6)],
            policyNumber: `${isImage ? 'IMG' : 'PDF'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            premium: (Math.random() * 50000 + 5000).toFixed(2),
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            coverage: 'Cobertura Compreensiva',
            paymentForm: ['Mensal', 'Anual', 'Semestral', 'Trimestral'][Math.floor(Math.random() * 4)],
            installments: Math.floor(Math.random() * 12) + 1,
            monthlyAmount: (Math.random() * 2000 + 200).toFixed(2),
            fileName: file.name,
            extractedAt: new Date().toISOString(),
            confidence: 0.88 + Math.random() * 0.11 // 88% a 99%
          };
          resolve(mockData);
        } else {
          reject(new Error('Falha na extração de dados. Documento não legível, com qualidade insuficiente ou formato inválido.'));
        }
      }, extractionTime);
    });
  };

  const processFile = async (file: File) => {
    setFileUploads(prev => prev.map(upload => 
      upload.file === file 
        ? { ...upload, status: 'processing', progress: 0 }
        : upload
    ));

    try {
      // Simula progresso de upload
      for (let progress = 0; progress <= 40; progress += 8) {
        await new Promise(resolve => setTimeout(resolve, 120));
        setFileUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress }
            : upload
        ));
      }

      // Extração de dados
      const extractedData = await simulateAIExtraction(file);
      
      // Progresso da extração
      for (let progress = 50; progress <= 80; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFileUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress }
            : upload
        ));
      }

      // Envio para n8n
      try {
        await sendToN8N(file, extractedData);
      } catch (webhookError) {
        console.warn('Webhook falhou, mas continuando com o processamento local:', webhookError);
      }

      // Finalização
      setFileUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { 
              ...upload, 
              status: 'completed', 
              progress: 100, 
              extractedData 
            }
          : upload
      ));

      onPolicyExtracted(extractedData);

      toast({
        title: "Extração Concluída",
        description: `${file.name} processado com ${(extractedData.confidence * 100).toFixed(0)}% de confiança`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na extração';
      
      setFileUploads(prev => prev.map(upload => 
        upload.file === file 
          ? { 
              ...upload, 
              status: 'error', 
              error: errorMessage 
            }
          : upload
      ));

      toast({
        title: "Falha na Extração",
        description: `${file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (files: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Verificar limite de arquivos
    if (fileUploads.length + files.length > MAX_FILES) {
      toast({
        title: "Limite Excedido",
        description: `Máximo de ${MAX_FILES} arquivos por vez. Você tem ${fileUploads.length} e está tentando adicionar ${files.length}.`,
        variant: "destructive"
      });
      return;
    }

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Arquivos Rejeitados",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      const newUploads: FileUploadStatus[] = validFiles.map(file => ({
        file,
        status: 'pending',
        progress: 0
      }));

      setFileUploads(prev => [...prev, ...newUploads]);
      
      // Processar arquivos com delay escalonado
      setIsProcessingBatch(true);
      validFiles.forEach((file, index) => {
        setTimeout(() => {
          processFile(file);
          if (index === validFiles.length - 1) {
            setTimeout(() => setIsProcessingBatch(false), 1000);
          }
        }, index * 800); // 800ms entre cada arquivo
      });

      toast({
        title: "Arquivos Adicionados",
        description: `${validFiles.length} arquivo(s) adicionado(s) para processamento`,
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFileUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
    toast({
      title: "Arquivo Removido",
      description: `${fileToRemove.name} foi removido da lista`,
    });
  };

  const retryFile = (file: File) => {
    setFileUploads(prev => prev.map(upload => 
      upload.file === file 
        ? { ...upload, status: 'pending', progress: 0, error: undefined }
        : upload
    ));
    processFile(file);
  };

  const clearCompleted = () => {
    const completedCount = fileUploads.filter(u => u.status === 'completed').length;
    setFileUploads(prev => prev.filter(upload => upload.status !== 'completed'));
    toast({
      title: "Lista Limpa",
      description: `${completedCount} arquivo(s) processado(s) removido(s) da lista`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <ImageIcon className="h-5 w-5 text-blue-600" />;
  };

  const getStatusIcon = (upload: FileUploadStatus) => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Seguro Auto',
      vida: 'Seguro de Vida',
      saude: 'Seguro Saúde',
      empresarial: 'Empresarial',
      patrimonial: 'Patrimonial'
    };
    return types[type] || type;
  };

  const completedCount = fileUploads.filter(u => u.status === 'completed').length;
  const errorCount = fileUploads.filter(u => u.status === 'error').length;
  const processingCount = fileUploads.filter(u => u.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-blue-600" />
              <span className="text-xl">Upload Inteligente</span>
              <Badge variant="outline" className="flex items-center space-x-1 bg-white">
                <Webhook className="h-3 w-3" />
                <span>n8n Integrado</span>
              </Badge>
            </div>
            {fileUploads.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-white">
                  {completedCount} ✓ | {errorCount} ✗ | {processingCount} ⏳
                </Badge>
                {completedCount > 0 && (
                  <Button onClick={clearCompleted} variant="outline" size="sm">
                    <FileCheck className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-100/50 scale-105' 
                  : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50/50'
              } ${isProcessingBatch ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => !isProcessingBatch && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <Upload className={`mx-auto h-16 w-16 ${isDragOver ? 'text-blue-600' : 'text-blue-400'} transition-colors`} />
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    {isDragOver ? 'Solte os arquivos aqui!' : 'Arraste PDFs ou imagens'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Suporte para PDF, JPG, PNG • Máximo 10MB • Até {MAX_FILES} arquivos
                  </p>
                  <Button variant="outline" size="lg" disabled={isProcessingBatch}>
                    {isProcessingBatch ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivos
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                disabled={isProcessingBatch}
              />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Webhook className="h-4 w-4" />
                <AlertDescription>
                  <strong>Integração n8n:</strong> Processamento automático via webhook
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>IA Avançada:</strong> Extração com 92% de precisão
                </AlertDescription>
              </Alert>
              
              <Alert className="bg-purple-50 border-purple-200">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Multi-formato:</strong> PDFs e imagens suportados
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {fileUploads.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Processamento de Arquivos</span>
              <Badge variant="outline">{fileUploads.length} arquivo(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileUploads.map((upload, index) => (
                <div key={index} className="p-4 border rounded-xl bg-gray-50/50 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(upload.file)}
                      <div>
                        <p className="font-medium text-gray-900">{upload.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB • 
                          {upload.file.type.includes('pdf') ? ' PDF' : ' Imagem'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload)}
                      {upload.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryFile(upload.file)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(upload.file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {upload.status === 'processing' && (
                    <div className="space-y-2">
                      <Progress value={upload.progress} className="h-3" />
                      <p className="text-xs text-gray-500 flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {upload.progress < 40 ? 'Fazendo upload...' : 
                         upload.progress < 80 ? 'Extraindo dados com IA...' : 'Enviando para n8n...'}
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {upload.status === 'error' && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{upload.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Extracted Data */}
                  {upload.status === 'completed' && upload.extractedData && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-green-800 flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Dados Extraídos
                        </h4>
                        <Badge variant="outline" className="text-green-700 bg-green-100">
                          {(upload.extractedData.confidence * 100).toFixed(0)}% confiança
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Apólice:</span>
                          <p className="text-gray-800">{upload.extractedData.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Tipo:</span>
                          <p className="text-gray-800">{getTypeLabel(upload.extractedData.type)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Seguradora:</span>
                          <p className="text-gray-800">{upload.extractedData.insurer}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Número:</span>
                          <p className="text-gray-800">{upload.extractedData.policyNumber}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Valor:</span>
                          <p className="text-gray-800">R$ {parseFloat(upload.extractedData.premium).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Pagamento:</span>
                          <p className="text-gray-800">{upload.extractedData.paymentForm}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
