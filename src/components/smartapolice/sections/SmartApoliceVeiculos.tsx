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
  Bell
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SmartApoliceVeiculosProps {
  apolices: any[];
  onPolicyUpdate: (policy: any) => void;
}

export function SmartApoliceVeiculos({
  apolices,
  onPolicyUpdate
}: SmartApoliceVeiculosProps) {

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data para veículos e emplacamentos
  const mockVehicles = apolices.map((apolice, index) => ({
    id: apolice.id || index,
    placa: apolice.veiculo?.placa || `ABC${1234 + index}`,
    marca: apolice.veiculo?.marca || 'FIAT',
    modelo: apolice.veiculo?.modelo || 'ARGO',
    ano_modelo: apolice.veiculo?.ano_modelo || 2022,
    ano_fabricacao: apolice.veiculo?.ano_fabricacao || 2021,
    categoria: apolice.veiculo?.categoria || 'PASSEIO',
    chassi: apolice.veiculo?.chassi || `9BD171700${(index * 123456).toString().padStart(8, '0')}`,
    renavam: apolice.veiculo?.renavam || `${(12345678900 + index * 111).toString()}`,
    combustivel: apolice.veiculo?.combustivel || 'FLEX',
    cor: apolice.veiculo?.cor || 'BRANCO',
    proprietario: apolice.cliente?.nome_razao || 'João Silva',
    documento_proprietario: apolice.cliente?.cpf || apolice.cliente?.cnpj || '123.456.789-09',
    emplacamento: {
      uf: ['SP', 'RJ', 'MG', 'PR', 'RS'][index % 5],
      vencimento: new Date(Date.now() + (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['EM_DIA', 'VENCIDO', 'PROXIMO_VENCIMENTO'][Math.floor(Math.random() * 3)],
      observacoes: index % 3 === 0 ? 'Transferência pendente' : null
    },
    seguro_ativo: apolice.apolice?.status === 'ATIVA' || Math.random() > 0.2,
    ultima_atualizacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));

  // Filtrar veículos
  const filteredVehicles = mockVehicles.filter(vehicle => {
    const matchesCategory = selectedCategory === 'all' || vehicle.categoria === selectedCategory;
    const matchesSearch = !searchTerm || 
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.proprietario.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
        status: 'VENCIDO',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-700 bg-red-100',
        label: `Vencido há ${Math.abs(daysUntil)} dias`
      };
    } else if (daysUntil <= 30) {
      return {
        status: 'PROXIMO_VENCIMENTO',
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-700 bg-yellow-100',
        label: `Vence em ${daysUntil} dias`
      };
    } else {
      return {
        status: 'EM_DIA',
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-700 bg-green-100',
        label: 'Em dia'
      };
    }
  };

  const getCategoryBadge = (categoria: string) => {
    const categories = {
      'PASSEIO': { color: 'bg-blue-100 text-blue-700', label: 'Passeio' },
      'UTILITARIO': { color: 'bg-green-100 text-green-700', label: 'Utilitário' },
      'CAMINHAO': { color: 'bg-orange-100 text-orange-700', label: 'Caminhão' },
      'MOTO': { color: 'bg-purple-100 text-purple-700', label: 'Moto' },
      'OUTRO': { color: 'bg-gray-100 text-gray-700', label: 'Outro' }
    };
    
    const config = categories[categoria as keyof typeof categories] || categories['OUTRO'];
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
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
    semSeguro: filteredVehicles.filter(v => !v.seguro_ativo).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Veículos</h1>
          <p className="text-gray-600 mt-1">
            Controle de veículos e emplacamento
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.vencidos}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.proximoVencimento}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.semSeguro}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Veículos Cadastrados ({filteredVehicles.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum veículo encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Importe apólices para visualizar os veículos'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Categoria</TableHead>
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
                                {vehicle.ano_fabricacao}/{vehicle.ano_modelo} - {vehicle.cor}
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
                          {getCategoryBadge(vehicle.categoria)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vehicle.proprietario}</p>
                            <p className="text-sm text-gray-500 font-mono">
                              {vehicle.documento_proprietario}
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
                            <Button variant="ghost" size="sm">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Vencimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredVehicles
                .filter(v => getDaysUntilExpiration(v.emplacamento.vencimento) <= 30)
                .slice(0, 5)
                .map((vehicle) => {
                  const daysUntil = getDaysUntilExpiration(vehicle.emplacamento.vencimento);
                  const isOverdue = daysUntil < 0;
                  
                  return (
                    <div 
                      key={vehicle.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <AlertTriangle className={`h-5 w-5 mr-3 ${
                          isOverdue ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <div>
                          <p className="font-medium">{vehicle.placa} - {vehicle.marca} {vehicle.modelo}</p>
                          <p className={`text-sm ${
                            isOverdue ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {isOverdue 
                              ? `Vencido há ${Math.abs(daysUntil)} dias` 
                              : `Vence em ${daysUntil} dias`
                            }
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Renovar
                      </Button>
                    </div>
                  );
                })}
              
              {filteredVehicles.filter(v => getDaysUntilExpiration(v.emplacamento.vencimento) <= 30).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum alerta de vencimento</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                filteredVehicles.reduce((acc, vehicle) => {
                  acc[vehicle.categoria] = (acc[vehicle.categoria] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([categoria, count]) => (
                <div key={categoria} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{getCategoryBadge(categoria)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / filteredVehicles.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}