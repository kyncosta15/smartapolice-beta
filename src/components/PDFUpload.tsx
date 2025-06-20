
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedPolicyData {
  name: string;
  type: string;
  insurer: string;
  policyNumber: string;
  premium: string;
  startDate: string;
  endDate: string;
  coverage: string;
}

interface PDFUploadProps {
  onPolicyExtracted: (policy: ExtractedPolicyData) => void;
}

export const PDFUpload = ({ onPolicyExtracted }: PDFUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedPolicies, setExtractedPolicies] = useState<ExtractedPolicyData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        title: "Atenção",
        description: "Apenas arquivos PDF são aceitos",
        variant: "destructive"
      });
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
  };

  const simulateAIExtraction = async (file: File): Promise<ExtractedPolicyData> => {
    // Simula extração de dados por IA - em produção seria uma chamada real para API de OCR/IA
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: ExtractedPolicyData = {
          name: `Apólice ${file.name.replace('.pdf', '')}`,
          type: ['auto', 'vida', 'saude', 'empresarial', 'patrimonial'][Math.floor(Math.random() * 5)],
          insurer: ['Porto Seguro', 'SulAmérica', 'Bradesco Seguros', 'Allianz', 'Mapfre'][Math.floor(Math.random() * 5)],
          policyNumber: `AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          premium: (Math.random() * 50000 + 5000).toFixed(2),
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          coverage: 'Cobertura Compreensiva'
        };
        resolve(mockData);
      }, 2000 + Math.random() * 3000);
    });
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const newExtractedPolicies: ExtractedPolicyData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`Processando arquivo ${i + 1}/${files.length}: ${file.name}`);
        
        // Simula upload do arquivo
        setProgress((i / files.length) * 50);
        
        // Extrai dados usando IA
        const extractedData = await simulateAIExtraction(file);
        
        // Adiciona à lista de apólices extraídas
        newExtractedPolicies.push(extractedData);
        
        // Notifica o componente pai
        onPolicyExtracted(extractedData);
        
        setProgress(((i + 1) / files.length) * 100);
        
        toast({
          title: "Sucesso",
          description: `Dados extraídos de ${file.name}`,
        });
        
      } catch (error) {
        console.error(`Erro processando ${file.name}:`, error);
        toast({
          title: "Erro",
          description: `Falha ao processar ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setExtractedPolicies(prev => [...prev, ...newExtractedPolicies]);
    setUploading(false);
    setFiles([]);
    setProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Processamento Concluído",
      description: `${newExtractedPolicies.length} apólices processadas com sucesso`,
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Importar Apólices PDF</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arraste arquivos PDF aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Suporte para múltiplos arquivos PDF
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Lista de Arquivos */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Arquivos Selecionados:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Progresso */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processando PDFs com IA...</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">{progress.toFixed(0)}% concluído</p>
              </div>
            )}

            {/* Botão de Processar */}
            <div className="flex justify-end">
              <Button
                onClick={processFiles}
                disabled={files.length === 0 || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Processar {files.length} arquivo{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Extrações */}
      {extractedPolicies.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Apólices Extraídas Recentemente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractedPolicies.slice(-5).map((policy, index) => (
                <div key={index} className="p-4 border rounded-lg bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{policy.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{getTypeLabel(policy.type)}</Badge>
                        <Badge variant="outline">{policy.insurer}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Número: {policy.policyNumber} | Prêmio: R$ {parseFloat(policy.premium).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
