import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2,
  Search,
  Filter,
  Plus,
  File,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FrotasDocumentosProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
}

const tipoDocumentoOptions = [
  { value: 'nf', label: 'Nota Fiscal' },
  { value: 'crlv', label: 'CRLV' },
  { value: 'termo_responsabilidade', label: 'Termo de Responsabilidade' },
  { value: 'termo_devolucao', label: 'Termo de Devolução' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
];

export function FrotasDocumentos({ veiculos, loading }: FrotasDocumentosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>('all');

  // Extrair todos os documentos de todos os veículos
  const allDocuments = React.useMemo(() => {
    const docs: Array<{
      id: string;
      veiculo: FrotaVeiculo;
      documento: any;
    }> = [];

    veiculos.forEach(veiculo => {
      if (veiculo.documentos) {
        veiculo.documentos.forEach(doc => {
          docs.push({
            id: doc.id,
            veiculo,
            documento: doc
          });
        });
      }
    });

    return docs;
  }, [veiculos]);

  // Filtrar documentos
  const filteredDocuments = React.useMemo(() => {
    return allDocuments.filter(item => {
      const matchesSearch = !searchTerm || 
        item.veiculo.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.documento.nome_arquivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.veiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.veiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = tipoFilter === 'all' || item.documento.tipo === tipoFilter;
      const matchesVeiculo = selectedVeiculo === 'all' || item.veiculo.id === selectedVeiculo;

      return matchesSearch && matchesTipo && matchesVeiculo;
    });
  }, [allDocuments, searchTerm, tipoFilter, selectedVeiculo]);

  const getTipoLabel = (tipo: string) => {
    const option = tipoDocumentoOptions.find(opt => opt.value === tipo);
    return option?.label || tipo;
  };

  const getTipoBadge = (tipo: string) => {
    const colors = {
      nf: 'bg-blue-100 text-blue-800 border-blue-200',
      crlv: 'bg-green-100 text-green-800 border-green-200',
      termo_responsabilidade: 'bg-orange-100 text-orange-800 border-orange-200',
      termo_devolucao: 'bg-purple-100 text-purple-800 border-purple-200',
      contrato: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      outro: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge className={colors[tipo as keyof typeof colors] || colors.outro}>
        {getTipoLabel(tipo)}
      </Badge>
    );
  };

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <FileImage className="h-4 w-4 text-blue-600" />;
    }
    
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getOrigemBadge = (origem: string) => {
    return origem === 'extracao' ? (
      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
        IA
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Manual
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                  <div className="rounded bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de upload */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Documentos da Frota
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie todos os documentos dos veículos
          </p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Documento
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por placa, nome do arquivo ou veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedVeiculo} onValueChange={setSelectedVeiculo}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os veículos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {veiculos.map((veiculo) => (
                  <SelectItem key={veiculo.id} value={veiculo.id}>
                    {veiculo.placa || 'Sem placa'} - {veiculo.marca || ''} {veiculo.modelo || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tipoDocumentoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Não há documentos que correspondam aos filtros aplicados.
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data Upload</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(item.documento.nome_arquivo, item.documento.tipo_mime)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.documento.nome_arquivo}
                            </div>
                            {item.documento.tipo_mime && (
                              <div className="text-xs text-gray-500">
                                {item.documento.tipo_mime}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {item.veiculo.placa}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.veiculo.marca} {item.veiculo.modelo}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getTipoBadge(item.documento.tipo)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatFileSize(item.documento.tamanho_arquivo)}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getOrigemBadge(item.documento.origem)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(item.documento.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}