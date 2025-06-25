import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, Shield, AlertTriangle, Brain, AlertCircle, Bell, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EnhancedDashboardProps {
  policies: any[];
  onNotificationClick?: () => void;
}

interface KPIData {
  totalApolices: number;
  custoMensal: number;
  valorSeguradoTotal: number;
  apolicesVencendo: number;
}

interface ChartData {
  seguradoras: { name: string; value: number }[];
  tipos: { name: string; value: number }[];
  monthlyTrend: { month: string; value: number }[];
}

export function EnhancedDashboard({ policies, onNotificationClick }: EnhancedDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  
  const kpiData: KPIData = {
    totalApolices: policies.length,
    custoMensal: policies.reduce((sum, p) => sum + (p.monthlyAmount || p.premium / 12), 0),
    valorSeguradoTotal: policies.reduce((sum, p) => sum + p.premium, 0),
    apolicesVencendo: policies.filter(p => new Date(p.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
  };

  const seguradorasData = policies.reduce((acc: any, policy) => {
    const insurer = policy.insurer || 'Não Informado';
    acc[insurer] = (acc[insurer] || 0) + policy.premium;
    return acc;
  }, {});

  const tiposData = policies.reduce((acc: any, policy) => {
    const type = policy.type || 'Não Informado';
    acc[type] = (acc[type] || 0) + policy.premium;
    return acc;
  }, {});

  const monthlyTrendData = [
    { month: 'Jan', value: 12000 },
    { month: 'Fev', value: 15000 },
    { month: 'Mar', value: 11000 },
    { month: 'Abr', value: 18000 },
    { month: 'Mai', value: 16000 },
    { month: 'Jun', value: 19000 },
  ];

  const chartData: ChartData = {
    seguradoras: Object.entries(seguradorasData).map(([name, value]) => ({ name, value: value as number })),
    tipos: Object.entries(tiposData).map(([name, value]) => ({ name, value: value as number })),
    monthlyTrend: monthlyTrendData,
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const insights = [
    "Cobertura duplicada identificada em apólices de diferentes seguradoras. Recomenda-se revisar para otimizar custos.",
    "Apólices de seguro de vida com baixa utilização nos últimos anos. Considere renegociar os termos.",
    "Identificados gaps de cobertura em seguros patrimoniais. Avalie a inclusão de coberturas adicionais para proteção abrangente.",
  ];

  const notifications = [
    { id: 1, message: "3 apólices vencem nos próximos 30 dias", type: "warning" },
    { id: 2, message: "Nova recomendação de otimização disponível", type: "info" },
    { id: 3, message: "Pagamento de apólice processado com sucesso", type: "success" },
  ];

  const handleChartClick = (data: any, chartType: string) => {
    setSelectedData({ ...data, chartType });
    setDialogOpen(true);
  };

  const renderDetailDialog = () => {
    if (!selectedData) return null;

    const getDetailedInfo = () => {
      switch (selectedData.chartType) {
        case 'seguradoras':
          return {
            title: `Análise Detalhada - ${selectedData.name}`,
            metrics: [
              { label: 'Valor Total', value: `R$ ${selectedData.value.toLocaleString('pt-BR')}`, color: 'blue' },
              { label: 'Participação', value: '35%', color: 'green' },
              { label: 'Crescimento', value: '+12.5%', color: 'purple' },
              { label: 'Apólices Ativas', value: '45', color: 'orange' }
            ],
            insights: [
              'Seguradora com maior volume de apólices corporativas',
              'Crescimento constante nos últimos 6 meses',
              'Excelente histórico de sinistros e pagamentos',
              'Oportunidade de negociação de descontos por volume'
            ]
          };
        case 'tipos':
          return {
            title: `Detalhamento - Seguros ${selectedData.name}`,
            metrics: [
              { label: 'Valor Investido', value: `R$ ${selectedData.value.toLocaleString('pt-BR')}`, color: 'blue' },
              { label: 'Cobertura Média', value: 'R$ 85.000', color: 'green' },
              { label: 'Franquia Média', value: 'R$ 2.500', color: 'purple' },
              { label: 'Sinistralidade', value: '8.5%', color: 'orange' }
            ],
            insights: [
              'Categoria com melhor custo-benefício da carteira',
              'Baixo índice de sinistros nos últimos 2 anos',
              'Recomenda-se revisão anual das coberturas',
              'Potencial para inclusão de coberturas adicionais'
            ]
          };
        case 'tendencia':
          return {
            title: `Análise de Tendência - ${selectedData.month}`,
            metrics: [
              { label: 'Custo do Mês', value: `R$ ${selectedData.value.toLocaleString('pt-BR')}`, color: 'blue' },
              { label: 'Variação', value: '+8.2%', color: 'green' },
              { label: 'Média Trimestral', value: 'R$ 15.200', color: 'purple' },
              { label: 'Projeção', value: 'R$ 18.500', color: 'orange' }
            ],
            insights: [
              'Tendência de crescimento controlado dos custos',
              'Sazonalidade típica para o período analisado',
              'Novos contratos impactaram positivamente',
              'Projeção dentro do orçamento planejado'
            ]
          };
        default:
          return {
            title: 'Informações Detalhadas',
            metrics: [],
            insights: []
          };
      }
    };

    const detailInfo = getDetailedInfo();

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 break-words">
              {detailInfo.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {detailInfo.metrics.map((metric, index) => (
                <div key={index} className={`bg-${metric.color}-50 p-3 rounded-lg border border-${metric.color}-200`}>
                  <p className={`text-xs text-${metric.color}-600 font-medium truncate`}>{metric.label}</p>
                  <p className={`text-lg font-bold text-${metric.color}-700 break-words`}>{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                Insights e Recomendações
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {detailInfo.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded-lg border border-gray-200">
                    <AlertCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 break-words">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Evolução Histórica</h4>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={[
                  { mes: 'Jan', valor: 12000 },
                  { mes: 'Fev', valor: 15000 },
                  { mes: 'Mar', valor: 11000 },
                  { mes: 'Abr', valor: 18000 },
                  { mes: 'Mai', valor: 16000 },
                  { mes: 'Jun', valor: selectedData.value || 19000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* Notifications Panel */}
      {/* KPI Cards - Improved responsive layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 truncate">Total de Apólices</CardTitle>
            <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg lg:text-xl font-bold text-gray-900 break-words">{kpiData.totalApolices}</div>
            <p className="text-xs text-gray-500 mt-1 truncate">Apólices ativas no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 truncate">Custo Mensal</CardTitle>
            <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg lg:text-xl font-bold text-gray-900 break-words">
              R$ {kpiData.custoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">Todas as apólices ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 truncate">Valor Segurado</CardTitle>
            <Shield className="h-3 w-3 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg lg:text-xl font-bold text-gray-900 break-words">
              R$ {kpiData.valorSeguradoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">Cobertura total</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 truncate">Vencendo</CardTitle>
            <AlertTriangle className="h-3 w-3 text-orange-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg lg:text-xl font-bold text-gray-900">{kpiData.apolicesVencendo}</div>
            <p className="text-xs text-gray-500 mt-1 truncate">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Optimized layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Seguradoras Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 truncate">Distribuição por Seguradora</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.seguradoras}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data) => handleChartClick(data, 'seguradoras')}
                    className="cursor-pointer"
                  >
                    {chartData.seguradoras.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`R$ ${value.toLocaleString('pt-BR')}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tipos Chart */}
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 truncate">Tipos de Seguro</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.tipos} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[2, 2, 0, 0]}
                    onClick={(data) => handleChartClick(data, 'tipos')}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendência Mensal - Full width chart */}
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 truncate">Tendência de Custos Mensais</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthlyTrend} margin={{ top: 15, right: 15, left: 15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Custo']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, className: 'cursor-pointer hover:r-7 transition-all' }}
                  onClick={(data) => handleChartClick(data, 'tendencia')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights AI - Improved layout */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center">
            <Brain className="h-4 w-4 mr-2 text-purple-600" />
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                <AlertCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 break-words">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {renderDetailDialog()}
    </div>
  );
}
