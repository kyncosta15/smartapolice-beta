import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar,
  Filter,
  PieChart,
  TrendingUp,
  Users,
  Car,
  Shield,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface SmartApoliceRelatoriosProps {
  apolices: any[];
}

export function SmartApoliceRelatorios({ apolices }: SmartApoliceRelatoriosProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('2025');
  const [selectedFilters, setSelectedFilters] = useState({
    seguradora: 'all',
    status: 'all',
    categoria: 'all',
    vencimento: 'all'
  });

  // Mock data para relatórios
  const reportStats = {
    totalApolices: apolices.length || 15,
    totalPremio: 3850000, // em centavos
    ativasCount: 12,
    vencidasCount: 2,
    canceladasCount: 1,
    categorias: {
      passeio: 8,
      utilitario: 4,
      caminhao: 2,
      moto: 1
    },
    seguradoras: {
      'Seguradora A': 6,
      'Seguradora B': 4,
      'Seguradora C': 3,
      'Outras': 2
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const handleGenerateReport = (reportType: string) => {
    console.log('Gerando relatório:', reportType, 'com filtros:', selectedFilters);
    // Aqui seria implementada a geração real do PDF
  };

  const handleExportData = (format: string) => {
    console.log('Exportando dados em formato:', format);
    // Aqui seria implementada a exportação real
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios & Exportação</h1>
          <p className="text-gray-600 mt-1">
            Gere relatórios detalhados e exporte dados em PDF
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Relatório
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros para Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="last12months">Últimos 12 meses</option>
                <option value="custom">Período personalizado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seguradora
              </label>
              <select
                value={selectedFilters.seguradora}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, seguradora: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas</option>
                <option value="seguradoraA">Seguradora A</option>
                <option value="seguradoraB">Seguradora B</option>
                <option value="seguradoraC">Seguradora C</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedFilters.status}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="vencida">Vencidas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedFilters.categoria}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas</option>
                <option value="passeio">Passeio</option>
                <option value="utilitario">Utilitário</option>
                <option value="caminhao">Caminhão</option>
                <option value="moto">Moto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vencimento
              </label>
              <select
                value={selectedFilters.vencimento}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, vencimento: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="30days">Próximos 30 dias</option>
                <option value="60days">Próximos 60 dias</option>
                <option value="90days">Próximos 90 dias</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Apólices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportStats.totalApolices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Prêmio Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(reportStats.totalPremio)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Veículos Passeio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportStats.categorias.passeio}
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
                <p className="text-sm font-medium text-gray-600">A Vencer</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {reportStats.vencidasCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Relatórios Consolidados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Relatório Geral</h3>
                  <p className="text-sm text-gray-600">
                    Resumo completo de todas as apólices
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleGenerateReport('geral')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Relatório por Categoria</h3>
                  <p className="text-sm text-gray-600">
                    Análise por tipo de veículo
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('categoria')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Relatório Financeiro</h3>
                  <p className="text-sm text-gray-600">
                    Análise de prêmios e pagamentos
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('financeiro')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Relatório de Vencimentos</h3>
                  <p className="text-sm text-gray-600">
                    Alertas de renovação e vencimentos
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('vencimentos')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Relatórios Específicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Por Seguradora</h3>
                  <p className="text-sm text-gray-600">
                    Distribuição por seguradora
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleGenerateReport('seguradora')}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Análise de Custos</h3>
                  <p className="text-sm text-gray-600">
                    Evolução de custos por período
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('custos')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Perfil de Clientes</h3>
                  <p className="text-sm text-gray-600">
                    Análise demográfica dos segurados
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('clientes')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">Ficha Individual</h3>
                  <p className="text-sm text-gray-600">
                    Relatório detalhado por veículo
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleGenerateReport('individual')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Opções de Exportação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => handleExportData('excel')}
            >
              <Download className="h-6 w-6 mb-2" />
              Planilha Excel
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => handleExportData('csv')}
            >
              <Download className="h-6 w-6 mb-2" />
              Arquivo CSV
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex-col"
              onClick={() => handleExportData('json')}
            >
              <Download className="h-6 w-6 mb-2" />
              Dados JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período Selecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reportStats.ativasCount}</div>
              <p className="text-sm text-gray-600">Apólices Ativas</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reportStats.vencidasCount}</div>
              <p className="text-sm text-gray-600">Próximas ao Vencimento</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{reportStats.canceladasCount}</div>
              <p className="text-sm text-gray-600">Canceladas</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(reportStats.totalPremio / reportStats.totalApolices)}
              </div>
              <p className="text-sm text-gray-600">Prêmio Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}