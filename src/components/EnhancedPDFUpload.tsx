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
  Webhook
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Arquivo enviado com sucesso para n8n');
        toast({
          title: "Webhook Executado",
          description: `Arquivo ${file.name} processado e enviado para n8n`,
        });
      } else {
        console.error('Erro ao enviar para n8n:', response.status);
        toast({
          title: "Erro no Webhook",
          description: "Falha ao enviar dados para n8n",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro na requisição para n8n:', error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o webhook n8n",
        variant: "destructive"
      });
    }
  };

  const simulateAIExtraction = async (file: File): Promise<ExtractedPolicyData> => {
    const isImage = file.type.startsWith('image/');
    const extractionTime = isImage ? 3000 + Math.random() * 2000 : 2000 + Math.random() * 3000;
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.9) {
          const mockData: ExtractedPolicyData = {
            id: `extracted-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: `Apólice ${file.name.replace(/\.(pdf|jpg|jpeg|png)$/i, '')}`,
            type: ['auto', 'vida', 'saude', 'empresarial', 'patrimonial'][Math.floor(Math.random() * 5)],
            insurer: ['Porto Seguro', 'SulAmérica', 'Bradesco Seguros', 'Allianz', 'Mapfre'][Math.floor(Math.random() * 5)],
            policyNumber: `${isImage ? 'IMG' : 'PDF'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            premium: (Math.random() * 50000 + 5000).toFixed(2),
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            coverage: 'Cobertura Compreensiva',
            paymentForm: ['Mensal', 'Anual', 'Semestral'][Math.floor(Math.random() * 3)],
            installments: Math.floor(Math.random() * 12) + 1,
            monthlyAmount: (Math.random() * 2000 + 200).toFixed(2),
            fileName: file.name,
            extractedAt: new Date().toISOString(),
            confidence: 0.85 + Math.random() * 0.14
          };
          resolve(mockData);
        } else {
          reject(new Error('Falha na extração de dados. Documento não legível ou formato inválido.'));
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
      for (let progress = 0; progress <= 50; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFileUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress }
            : upload
        ));
      }

      // Extração de dados
      const extractedData = await simulateAIExtraction(file);
      
      // Simula progresso final
      for (let progress = 60; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFileUploads(prev => prev.map(upload => 
          upload.file === file 
            ? { ...upload, progress }
            : upload
        ));
      }

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

      // Enviar para n8n webhook
      await sendToN8N(file, extractedData);

      onPolicyExtracted(extractedData);

      toast({
        title: "Sucesso",
        description: `Dados extraídos de ${file.name} (${(extractedData.confidence * 100).toFixed(0)}% confiança)`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
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
        title: "Erro na Extração",
        description: `${file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (files: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

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
        title: "Arquivos rejeitados",
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
      
      // Processar arquivos automaticamente
      validFiles.forEach((file, index) => {
        setTimeout(() => processFile(file), index * 500);
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFileUploads(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

  const retryFile = (file: File) => {
    setFileUploads(prev => prev.map(upload => 
      upload.file === file 
        ? { ...upload, status: 'pending', progress: 0, error: undefined }
        : upload
    ));
    processFile(file);
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
        return <Loader2 className="h-5 w-5 text-gray-400" />;
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
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload Inteligente com n8n</span>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Webhook className="h-3 w-3" />
              <span>Webhook Ativo</span>
            </Badge>
            {fileUploads.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                {completedCount} processados | {errorCount} erros | {processingCount} processando
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arraste PDFs ou imagens aqui
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Suporte para PDF, JPG, PNG • Máximo 10MB por arquivo
              </p>
              <Button variant="outline" size="sm">
                Ou clique para selecionar
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Info sobre IA e n8n */}
            <Alert>
              <Webhook className="h-4 w-4" />
              <AlertDescription>
                <strong>Integração n8n:</strong> Os arquivos processados são automaticamente enviados para o workflow n8n configurado para processamento adicional.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {fileUploads.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Arquivos em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileUploads.map((upload, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(upload.file)}
                      <div>
                        <p className="font-medium">{upload.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(upload)}
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
                      <Progress value={upload.progress} className="h-2" />
                      <p className="text-xs text-gray-500">
                        {upload.progress < 50 ? 'Fazendo upload...' : 'Extraindo dados com IA...'}
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {upload.status === 'error' && (
                    <div className="space-y-2">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{upload.error}</AlertDescription>
                      </Alert>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryFile(upload.file)}
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  )}

                  {/* Extracted Data */}
                  {upload.status === 'completed' && upload.extractedData && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800">Dados Extraídos</h4>
                        <Badge variant="outline" className="text-green-700">
                          {(upload.extractedData.confidence * 100).toFixed(0)}% confiança
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Apólice:</span> {upload.extractedData.name}
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {getTypeLabel(upload.extractedData.type)}
                        </div>
                        <div>
                          <span className="font-medium">Seguradora:</span> {upload.extractedData.insurer}
                        </div>
                        <div>
                          <span className="font-medium">Número:</span> {upload.extractedData.policyNumber}
                        </div>
                        <div>
                          <span className="font-medium">Valor:</span> R$ {parseFloat(upload.extractedData.premium).toLocaleString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Pagamento:</span> {upload.extractedData.paymentForm}
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
