import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Filter,
  Edit,
  Eye,
  Download,
  Bell,
  Calculator,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  FolderOpen,
  Upload,
  Settings
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface VeiculosManagementProps {
  allPolicies: ParsedPolicyData[];
  onPolicyUpdate: (policy: any) => void;
  onPolicySelect: (policy: any) => void;
}

export function VeiculosManagement({
  allPolicies,
  onPolicyUpdate,
  onPolicySelect
}: VeiculosManagementProps) {
  const [activeTab, setActiveTab] = useState('veiculos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Extrair dados de veículos das apólices existentes
  const extractVehicleData = (policies: ParsedPolicyData[]) => {
    return policies.map((policy, index) => {
      // Extrair placa do policy ou criar uma fictícia
      const extractPlaca = () => {
        // Verificar campos disponíveis nos dados das apólices
        const vehicleInfo = policy.vehicleModel || policy.name || '';
        const match = vehicleInfo.match(/[A-Z]{3}[0-9][A-Z][0-9]{2}|[A-Z]{3}-?[0-9]{4}/);
        if (match) return match[0].replace('-', '');
        
        // Se não encontrar placa, gerar uma baseada no índice
        return `VEI${(1000 + index).toString().slice(-3)}`;
      };

      // Extrair marca e modelo
      const extractMarcaModelo = () => {
        if (policy.vehicleModel) {
          const parts = policy.vehicleModel.split(' ');
          return {
            marca: parts[0] || 'N/A',
            modelo: parts.slice(1).join(' ') || 'N/A'
          };
        }
        return { marca: 'N/A', modelo: 'N/A' };
      };

      const { marca, modelo } = extractMarcaModelo();
      
      return {
        id: policy.id,
        placa: extractPlaca(),
        marca,
        modelo,
        ano_modelo: 2020 + (index % 5), // Anos variados
        categoria: 'PASSEIO',
        chassi: `9BD171700${(index * 123456).toString().padStart(8, '0')}`,
        renavam: `${(12345678900 + index * 111).toString()}`,
        combustivel: 'FLEX',
        cor: ['BRANCO', 'PRATA', 'PRETO', 'AZUL', 'VERMELHO'][index % 5],
        proprietario: policy.insuredName || policy.name || 'Proprietário',
        documento_proprietario: policy.documento || 'N/A',
        documento_tipo: policy.documento_tipo || 'CPF',
        emplacamento: {
          uf: policy.uf || 'SP',
          vencimento: new Date(Date.now() + (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['EM_DIA', 'VENCIDO', 'PROXIMO_VENCIMENTO'][Math.floor(Math.random() * 3)],
          observacoes: null
        },
        seguro_ativo: policy.status === 'vigente' || policy.policyStatus === 'vigente',
        ultima_atualizacao: policy.extractedAt || new Date().toISOString().split('T')[0],
        // Dados FIPE simulados
        fipe: {
          valor_compra_nf: Math.random() * 5000000 + 3000000,
          valor_atual_fipe: Math.random() * 6000000 + 3500000,
          data_consulta: new Date().toISOString().split('T')[0],
          codigo_fipe: `001001-${index}`,
          fonte: 'FIPE'
        },
        // Dados da apólice relacionada
        apolice: policy
      };
    }).filter(vehicle => vehicle.placa !== 'N/A');
  };

  const vehicles = extractVehicleData(allPolicies);

  // Calcular métricas FIPE
  const vehiclesWithFipe = vehicles.map(vehicle => {
    const tabelaPercent = vehicle.fipe.valor_compra_nf && vehicle.fipe.valor_atual_fipe 
      ? (vehicle.fipe.valor_compra_nf / vehicle.fipe.valor_atual_fipe) * 100 
      : null;
    
    const valorizacaoPercent = vehicle.fipe.valor_compra_nf && vehicle.fipe.valor_atual_fipe 
      ? ((vehicle.fipe.valor_atual_fipe - vehicle.fipe.valor_compra_nf) / vehicle.fipe.valor_compra_nf) * 100 
      : null;

    const sinalizador = tabelaPercent 
      ? tabelaPercent >= 95 ? 'A_VISTA' 
        : tabelaPercent >= 70 ? 'FINAN' 
        : 'CONSORCIO'
      : null;

    return {
      ...vehicle,
      tabelaPercent,
      valorizacaoPercent,
      sinalizador
    };
  });

  // Filtrar veículos
  const filteredVehicles = vehiclesWithFipe.filter(vehicle => {
    const matchesCategory = selectedCategory === 'all' || vehicle.categoria === selectedCategory;
    const matchesSearch = !searchTerm || 
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.proprietario.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)}%`;
  };

  const getDaysUntilExpiration = (dateString: string) => {
    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEmplacamentoStatus = (emplacamento: any) => {
    const daysUntil = getDaysUntilExpiration(emplacamento.vencimento);
    
    if (daysUntil < 0) {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-700 bg-red-100',
        label: `Vencido há ${Math.abs(daysUntil)} dias`
      };
    } else if (daysUntil <= 30) {
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-700 bg-yellow-100',
        label: `Vence em ${daysUntil} dias`
      };
    } else {
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-700 bg-green-100',
        label: 'Em dia'
      };
    }
  };

  const getSinalizadorBadge = (sinalizador: string | null) => {
    if (!sinalizador) return <Badge variant="outline">N/A</Badge>;

    const config = {
      'A_VISTA': { variant: 'default' as const, label: 'À Vista', color: 'bg-green-100 text-green-700' },
      'FINAN': { variant: 'secondary' as const, label: 'Financiamento', color: 'bg-blue-100 text-blue-700' },
      'CONSORCIO': { variant: 'outline' as const, label: 'Consórcio', color: 'bg-orange-100 text-orange-700' }
    };

    const sinalizadorConfig = config[sinalizador as keyof typeof config];
    
    return (
      <Badge variant={sinalizadorConfig.variant} className={sinalizadorConfig.color}>
        {sinalizadorConfig.label}
      </Badge>
    );
  };

  const getValorizacaoIcon = (percent: number | null) => {
    if (!percent) return null;
    return percent >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // Estatísticas
  const stats = {
    total: filteredVehicles.length,
    vencidos: filteredVehicles.filter(v => getDaysUntilExpiration(v.emplacamento.vencimento) < 0).length,
    proximoVencimento: filteredVehicles.filter(v => {
      const days = getDaysUntilExpiration(v.emplacamento.vencimento);
      return days > 0 && days <= 30;
    }).length,
    semSeguro: filteredVehicles.filter(v => !v.seguro_ativo).length,
    aVista: filteredVehicles.filter(v => v.sinalizador === 'A_VISTA').length,
    financiamento: filteredVehicles.filter(v => v.sinalizador === 'FINAN').length,
    consorcio: filteredVehicles.filter(v => v.sinalizador === 'CONSORCIO').length
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'veiculos':
        return renderVeiculosTab();
      case 'fipe':
        return renderFipeTab();
      case 'documentos':
        return renderDocumentosTab();
      case 'emplacamento':
        return renderEmplacamentoTab();
      default:
        return renderVeiculosTab();
    }
  };

  const renderVeiculosTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Veículos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emplacamento Vencido</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.vencidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Próximo Vencimento</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.proximoVencimento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sem Seguro</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.semSeguro}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="h-5 w-5 mr-2" />
            Veículos Cadastrados ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum veículo encontrado
              </h3>
              <p className="text-gray-600">
                Importe apólices com informações de veículos para visualizar a gestão
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Emplacamento</TableHead>
                    <TableHead>Status Seguro</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => {
                    const emplacamentoStatus = getEmplacamentoStatus(vehicle.emplacamento);
                    const IconComponent = emplacamentoStatus.icon;
                    
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-3 text-gray-400" />
                            <div>
                              <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                              <p className="text-sm text-gray-500">
                                {vehicle.ano_modelo} - {vehicle.cor}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-semibold text-lg">
                            {vehicle.placa}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vehicle.proprietario}</p>
                            <p className="text-sm text-gray-500 font-mono">
                              {vehicle.documento_tipo}: {vehicle.documento_proprietario}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="text-sm">{vehicle.emplacamento.uf}</span>
                            </div>
                            <Badge variant={emplacamentoStatus.variant} className={emplacamentoStatus.color}>
                              <IconComponent className="h-3 w-3 mr-1" />
                              {emplacamentoStatus.label}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Vence: {formatDate(vehicle.emplacamento.vencimento)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vehicle.seguro_ativo ? 'default' : 'destructive'}>
                            {vehicle.seguro_ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(vehicle.ultima_atualizacao)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onPolicySelect(vehicle.apolice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderFipeTab = () => (
    <div className="space-y-6">
      {/* FIPE KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">À Vista</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.aVista}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Financiamento</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.financiamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consórcio</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.consorcio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valorização Média</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercent(
                    vehiclesWithFipe
                      .filter(v => v.valorizacaoPercent !== null)
                      .reduce((sum, v) => sum + (v.valorizacaoPercent || 0), 0) / vehiclesWithFipe.length
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FIPE Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Análise FIPE por Veículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Valor Compra</TableHead>
                <TableHead>Valor FIPE</TableHead>
                <TableHead>Tabela (%)</TableHead>
                <TableHead>Valorização (%)</TableHead>
                <TableHead>Sinalizador</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiclesWithFipe.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                        <p className="text-sm text-gray-500">{vehicle.ano_modelo}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {vehicle.placa}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(vehicle.fipe.valor_compra_nf)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(vehicle.fipe.valor_atual_fipe)}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      (vehicle.tabelaPercent || 0) >= 95 
                        ? 'text-green-600' 
                        : (vehicle.tabelaPercent || 0) >= 70 
                        ? 'text-blue-600' 
                        : 'text-orange-600'
                    }`}>
                      {formatPercent(vehicle.tabelaPercent)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getValorizacaoIcon(vehicle.valorizacaoPercent)}
                      <span className={`font-medium ${
                        (vehicle.valorizacaoPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercent(vehicle.valorizacaoPercent)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSinalizadorBadge(vehicle.sinalizador)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderDocumentosTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Gestão de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Gestão de Documentos
          </h3>
          <p className="text-gray-600 mb-4">
            Funcionalidade para gestão de CNH, termos e documentos relacionados aos veículos
          </p>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmplacamentoTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Controle de Emplacamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVehicles
              .filter(v => getDaysUntilExpiration(v.emplacamento.vencimento) <= 90)
              .map((vehicle) => {
                const daysUntil = getDaysUntilExpiration(vehicle.emplacamento.vencimento);
                const isOverdue = daysUntil < 0;
                
                return (
                  <div 
                    key={vehicle.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isOverdue ? 'bg-red-50 border-red-200' : 
                      daysUntil <= 30 ? 'bg-yellow-50 border-yellow-200' : 
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <AlertTriangle className={`h-5 w-5 mr-3 ${
                        isOverdue ? 'text-red-600' : 
                        daysUntil <= 30 ? 'text-yellow-600' : 
                        'text-gray-600'
                      }`} />
                      <div>
                        <p className="font-medium">
                          {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                        </p>
                        <p className={`text-sm ${
                          isOverdue ? 'text-red-600' : 
                          daysUntil <= 30 ? 'text-yellow-600' : 
                          'text-gray-600'
                        }`}>
                          UF: {vehicle.emplacamento.uf} | 
                          {isOverdue 
                            ? ` Vencido há ${Math.abs(daysUntil)} dias` 
                            : ` Vence em ${daysUntil} dias`
                          } | {formatDate(vehicle.emplacamento.vencimento)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Renovar
                    </Button>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Veículos</h1>
          <p className="text-gray-600 mt-1">
            Controle completo de veículos, FIPE e documentação
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Alertas ({stats.vencidos + stats.proximoVencimento})
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por placa, marca, modelo ou proprietário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas Categorias</option>
                <option value="PASSEIO">Passeio</option>
                <option value="UTILITARIO">Utilitário</option>
                <option value="CAMINHAO">Caminhão</option>
                <option value="MOTO">Moto</option>
              </select>
            </div>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'veiculos', label: 'Veículos', icon: Car },
            { id: 'fipe', label: 'FIPE & Cálculos', icon: Calculator },
            { id: 'documentos', label: 'Documentos', icon: FileText },
            { id: 'emplacamento', label: 'Emplacamento', icon: Calendar }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}