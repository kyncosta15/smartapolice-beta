import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  CreditCard,
  PieChart
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { FrotaVeiculo, FrotaKPIs } from '@/hooks/useFrotasData';
import { ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface FrotasDashboardProps {
  kpis: FrotaKPIs;
  veiculos: FrotaVeiculo[];
  loading: boolean;
}

export function FrotasDashboard({ kpis, veiculos, loading }: FrotasDashboardProps) {
  // Preparar dados para gráficos
  const categoriaData = React.useMemo(() => {
    const categorias = veiculos.reduce((acc, v) => {
      const cat = v.categoria || 'outros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getRandomColor()
    }));
  }, [veiculos]);

  const marcasData = React.useMemo(() => {
    const marcas = veiculos.reduce((acc, v) => {
      if (!v.marca) return acc;
      acc[v.marca] = (acc[v.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(marcas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
        color: getRandomColor()
      }));
  }, [veiculos]);

  const modalidadeData = [
    { name: 'Financiado', value: kpis.modalidadeDistribuicao.financiado, color: '#3B82F6' },
    { name: 'À Vista', value: kpis.modalidadeDistribuicao.avista, color: '#10B981' },
    { name: 'Consórcio', value: kpis.modalidadeDistribuicao.consorcio, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Veículos
            </CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.totalVeiculos}
            </div>
            <p className="text-xs text-gray-500">
              veículos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sem Seguro
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpis.semSeguro}
            </div>
            <p className="text-xs text-gray-500">
              necessitam seguro
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Emplacamento Vencido
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpis.emplacamentoVencido}
            </div>
            <p className="text-xs text-gray-500">
              licenciamento vencido
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Próximo Vencimento
            </CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpis.proximoVencimento}
            </div>
            <p className="text-xs text-gray-500">
              vencem em 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valorização vs. Compra
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.valorizacaoMedia.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              média de valorização FIPE
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Modalidade de Compra
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Financiado:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.financiado}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>À Vista:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.avista}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Consórcio:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.consorcio}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Categoria */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={categoriaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoriaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Marcas */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-green-600" />
              Top Marcas/Modelos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {marcasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={marcasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getRandomColor() {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Fix import for Pie component
import { Pie } from 'recharts';