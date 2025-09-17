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
import { ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { FrotasTable } from './FrotasTable';

interface FrotasDashboardProps {
  kpis: FrotaKPIs;
  veiculos: FrotaVeiculo[];
  loading: boolean;
  onRefetch?: () => void;
}

export function FrotasDashboard({ kpis, veiculos, loading, onRefetch }: FrotasDashboardProps) {
  const isMobile = useIsMobile();

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-xl border bg-white p-4 sm:p-6 animate-pulse">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Total de Veículos
            </h3>
            <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {kpis.totalVeiculos}
            </div>
            <p className="text-xs text-gray-500 break-words">
              veículos cadastrados
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Sem Seguro
            </h3>
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-red-600 leading-tight">
              {kpis.semSeguro}
            </div>
            <p className="text-xs text-gray-500 break-words">
              necessitam seguro
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Emplacamento Vencido
            </h3>
            <Calendar className="h-4 w-4 text-orange-600 flex-shrink-0" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-orange-600 leading-tight">
              {kpis.emplacamentoVencido}
            </div>
            <p className="text-xs text-gray-500 break-words">
              licenciamento vencido
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border bg-white p-4 md:p-5 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Próximo Vencimento
            </h3>
            <Calendar className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600 leading-tight">
              {kpis.proximoVencimento}
            </div>
            <p className="text-xs text-gray-500 break-words">
              vencem em 30 dias
            </p>
          </div>
        </Card>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-xl border bg-white p-3 md:p-4 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Valorização vs. Compra
            </h3>
            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-green-600 leading-tight">
              {kpis.valorizacaoMedia.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 break-words">
              média de valorização FIPE
            </p>
          </div>
        </Card>

        <Card className="rounded-xl border bg-white p-3 md:p-4 min-h-[88px] flex flex-col justify-between">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600 leading-tight break-words">
              Modalidade de Compra
            </h3>
            <CreditCard className="h-4 w-4 text-purple-600 flex-shrink-0" />
          </div>
          <div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="break-words">Financiado:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.financiado}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="break-words">À Vista:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.avista}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="break-words">Consórcio:</span>
                <span className="font-medium">{kpis.modalidadeDistribuicao.consorcio}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Chart Wrapper with responsive heights */}
        {/* Distribuição por Categoria */}
        <Card className="rounded-xl border bg-white p-3 md:p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-base md:text-lg">
            <PieChart className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="break-words leading-tight">Distribuição por Categoria</span>
          </h3>
          <div className="w-full h-48 md:h-64 xl:h-80 overflow-x-auto">
            {categoriaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <Pie
                    data={categoriaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={!isMobile ? ({ name, value }) => `${name} ${value}` : false}
                    outerRadius={isMobile ? 60 : 80}
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
              <div className="h-full flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </Card>

        {/* Top Marcas */}
        <Card className="rounded-xl border bg-white p-3 md:p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="break-words leading-tight">Top Marcas/Modelos</span>
          </h3>
          <div className="w-full h-48 md:h-64 xl:h-80 overflow-x-auto">
            {marcasData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marcasData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    hide={isMobile}
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis hide={isMobile} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Vehicle List Table */}
      <div className="mt-6">
        <FrotasTable 
          veiculos={veiculos}
          loading={loading}
          onRefetch={onRefetch || (() => {})}
        />
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