import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Upload, 
  Download, 
  FileText, 
  Image,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface SmartApoliceDocumentosProps {
  selectedPolicy: any;
  onPolicyUpdate: (policy: any) => void;
}

export function SmartApoliceDocumentos({
  selectedPolicy,
  onPolicyUpdate
}: SmartApoliceDocumentosProps) {

  const [dragOver, setDragOver] = useState(false);

  // Mock data para documentos
  const mockDocuments = [
    {
      id: 1,
      tipo: 'CNH',
      nome: 'CNH - João Silva',
      arquivo: 'cnh_joao_silva.jpg',
      status: 'APROVADO',
      data_upload: '2025-01-15',
      validade: '2027-06-15',
      tamanho: '2.1 MB'
    },
    {
      id: 2,
      tipo: 'TERMO_RESPONSABILIDADE',
      nome: 'Termo de Responsabilidade de Locação',
      arquivo: 'termo_responsabilidade.pdf',
      status: 'ASSINADO',
      data_upload: '2025-01-10',
      validade: null,
      tamanho: '856 KB'
    },
    {
      id: 3,
      tipo: 'TERMO_DEVOLUCAO',
      nome: 'Termo de Devolução/Transferência',
      arquivo: null,
      status: 'PENDENTE',
      data_upload: null,
      validade: null,
      tamanho: null
    },
    {
      id: 4,
      tipo: 'APOLICE',
      nome: 'Apólice Original',
      arquivo: 'apolice_123456789.pdf',
      status: 'APROVADO',
      data_upload: '2025-01-05',
      validade: '2026-01-10',
      tamanho: '1.5 MB'
    }
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    // Simular upload
    console.log('Uploading files:', files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'APROVADO': { 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-green-700 bg-green-100' 
      },
      'ASSINADO': { 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-green-700 bg-green-100' 
      },
      'PENDENTE': { 
        variant: 'secondary' as const, 
        icon: Clock,
        color: 'text-yellow-700 bg-yellow-100' 
      },
      'REJEITADO': { 
        variant: 'destructive' as const, 
        icon: AlertTriangle,
        color: 'text-red-700 bg-red-100' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDENTE'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'CNH':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'APOLICE':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'TERMO_RESPONSABILIDADE':
      case 'TERMO_DEVOLUCAO':
        return <FileText className="h-5 w-5 text-purple-600" />;
      default:
        return <FolderOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isDocumentExpired = (validade: string | null) => {
    if (!validade) return false;
    return new Date(validade) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h1>
          <p className="text-gray-600 mt-1">
            CNH, termos e documentos relacionados às apólices
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download ZIP
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arraste documentos ou clique para selecionar
            </h3>
            <p className="text-gray-600 mb-4">
              Aceita: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
            </p>
            
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
              <Button variant="outline">
                <Image className="h-4 w-4 mr-2" />
                Capturar Foto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CNH Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            CNH do Responsável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da CNH
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="00000000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Selecione a categoria</option>
                  <option value="A">A - Motocicletas</option>
                  <option value="B">B - Automóveis</option>
                  <option value="C">C - Caminhões</option>
                  <option value="D">D - Ônibus</option>
                  <option value="E">E - Carreta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Validade
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Foto da CNH
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Clique para fazer upload da foto da CNH
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Selecionar Foto
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Documentos Anexados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  doc.validade && isDocumentExpired(doc.validade) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getDocumentIcon(doc.tipo)}
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.nome}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {doc.arquivo && <span>📎 {doc.arquivo}</span>}
                      {doc.tamanho && <span>💾 {doc.tamanho}</span>}
                      {doc.data_upload && <span>📅 {formatDate(doc.data_upload)}</span>}
                      {doc.validade && (
                        <span className={isDocumentExpired(doc.validade) ? 'text-red-600 font-medium' : ''}>
                          ⏰ Válido até {formatDate(doc.validade)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(doc.status)}
                  
                  <div className="flex items-center space-x-1">
                    {doc.arquivo && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms and Agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Termo de Responsabilidade de Locação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Gerar termo personalizado para esta apólice
              </p>
              <Button>
                Gerar Termo
              </Button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status do Termo
              </label>
              <Badge variant="secondary">Pendente de Assinatura</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termo de Devolução/Transferência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Gerar termo de devolução ou transferência
              </p>
              <Button variant="outline">
                Gerar Termo
              </Button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status do Termo
              </label>
              <Badge variant="outline">Não Aplicável</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}