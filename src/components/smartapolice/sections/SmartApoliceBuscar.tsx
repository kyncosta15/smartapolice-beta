import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Plus,
  Filter,
  Car,
  Shield,
  Calendar
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SmartApoliceBuscarProps {
  searchTerm: string;
  apolices: any[];
  onPolicyImport: (policy: any) => void;
  onPolicySelect: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
}

export function SmartApoliceBuscar({
  searchTerm,
  apolices,
  onPolicyImport,
  onPolicySelect,
  onPolicyDelete
}: SmartApoliceBuscarProps) {
  const [dragOver, setDragOver] = useState(false);

  // Filtrar apólices baseado no termo de busca
  const filteredApolices = apolices.filter(apolice => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      apolice.placa?.toLowerCase().includes(searchLower) ||
      apolice.cliente?.cpf?.includes(searchTerm) ||
      apolice.cliente?.cnpj?.includes(searchTerm) ||
      apolice.apolice?.numero?.toLowerCase().includes(searchLower) ||
      apolice.apolice?.seguradora?.toLowerCase().includes(searchLower) ||
      apolice.veiculo?.marca?.toLowerCase().includes(searchLower) ||
      apolice.veiculo?.modelo?.toLowerCase().includes(searchLower)
    );
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Simular processamento de arquivo
      const mockPolicy = {
        id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        cliente: {
          tipo_pessoa: "FISICA",
          nome_razao: "João Silva",
          cpf: "123.456.789-09",
          telefone_principal: "(11) 99999-9999"
        },
        veiculo: {
          placa: "ABC1D23",
          marca: "FIAT",
          modelo: "ARGO",
          ano_modelo: 2022,
          categoria: "PASSEIO"
        },
        apolice: {
          seguradora: "Seguradora Exemplo",
          numero: "123456789",
          vigencia_inicio: "2025-01-10",
          vigencia_fim: "2026-01-10",
          premio_total: 258900,
          status: "ATIVA"
        },
        arquivo_original: file.name,
        data_importacao: new Date().toISOString()
      };
      
      onPolicyImport(mockPolicy);
    });
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
      'ATIVA': { variant: 'default' as const, color: 'bg-green-500' },
      'CANCELADA': { variant: 'destructive' as const, color: 'bg-red-500' },
      'PENDENTE': { variant: 'secondary' as const, color: 'bg-yellow-500' },
      'VENCIDA': { variant: 'outline' as const, color: 'bg-gray-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDENTE'];
    
    return (
      <Badge variant={config.variant}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buscar & Importar</h1>
          <p className="text-gray-600 mt-1">
            Gerencie e importe suas apólices de seguro
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Arraste arquivos ou clique para selecionar
            </h3>
            <p className="text-gray-600 mb-4">
              Aceita: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG
            </p>
            
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Importar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Apólices Encontradas ({filteredApolices.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApolices.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma apólice encontrada
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou filtros'
                  : 'Importe seus primeiros documentos para começar'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Nº Apólice</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApolices.map((apolice) => (
                  <TableRow key={apolice.id}>
                    <TableCell className="font-mono font-semibold">
                      {apolice.veiculo?.placa || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {apolice.cliente?.nome_razao || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {apolice.cliente?.cpf || apolice.cliente?.cnpj || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Car className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {apolice.veiculo?.marca} {apolice.veiculo?.modelo}
                          </p>
                          <p className="text-sm text-gray-500">
                            {apolice.veiculo?.ano_modelo}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-gray-400" />
                        {apolice.apolice?.seguradora || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {apolice.apolice?.numero || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <div className="text-sm">
                          <p>{formatDate(apolice.apolice?.vigencia_inicio)}</p>
                          <p className="text-gray-500">
                            até {formatDate(apolice.apolice?.vigencia_fim)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(apolice.apolice?.premio_total || 0)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(apolice.apolice?.status || 'PENDENTE')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPolicySelect(apolice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPolicySelect(apolice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPolicyDelete(apolice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}