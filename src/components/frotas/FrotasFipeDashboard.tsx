import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Car, Bike, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface Vehicle {
  id: string;
  placa: string;
  preco_fipe?: number;
  categoria?: string;
}

interface FrotasFipeDashboardProps {
  veiculos: Vehicle[];
  loading?: boolean;
}

export function FrotasFipeDashboard({ veiculos, loading }: FrotasFipeDashboardProps) {
  const stats = useMemo(() => {
    const veiculosComFipe = veiculos.filter(v => v.preco_fipe && v.preco_fipe > 0);
    
    const total = veiculosComFipe.reduce((acc, v) => acc + (v.preco_fipe || 0), 0);
    
    const veiculosCarros = veiculosComFipe
      .filter(v => !v.categoria || v.categoria.toLowerCase().includes('carro') || v.categoria.toLowerCase() === 'automovel');
    const carros = veiculosCarros.reduce((acc, v) => acc + (v.preco_fipe || 0), 0);
    
    const veiculosCaminhoes = veiculosComFipe
      .filter(v => v.categoria?.toLowerCase().includes('caminh'));
    const caminhoes = veiculosCaminhoes.reduce((acc, v) => acc + (v.preco_fipe || 0), 0);
    
    const veiculosMotos = veiculosComFipe
      .filter(v => v.categoria?.toLowerCase().includes('moto'));
    const motos = veiculosMotos.reduce((acc, v) => acc + (v.preco_fipe || 0), 0);
    
    const outros = total - carros - caminhoes - motos;

    return {
      total,
      carros,
      caminhoes,
      motos,
      outros,
      quantidade: veiculosComFipe.length,
      quantidadeCarros: veiculosCarros.length,
      quantidadeCaminhoes: veiculosCaminhoes.length,
      quantidadeMotos: veiculosMotos.length
    };
  }, [veiculos]);

  const chartData = useMemo(() => {
    const data = [];
    
    if (stats.carros > 0) {
      data.push({ name: 'Carros', value: stats.carros, color: '#3b82f6' });
    }
    if (stats.caminhoes > 0) {
      data.push({ name: 'Caminhões', value: stats.caminhoes, color: '#f59e0b' });
    }
    if (stats.motos > 0) {
      data.push({ name: 'Motos', value: stats.motos, color: '#10b981' });
    }
    if (stats.outros > 0) {
      data.push({ name: 'Outros', value: stats.outros, color: '#6b7280' });
    }
    
    return data;
  }, [stats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-8 rounded-lg mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total FIPE */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Valor Total FIPE
              </p>
              <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                {formatCurrency(stats.total)}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {stats.quantidade} veículos cadastrados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carros */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-500 text-white shadow-lg">
                <Car className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                Carros
              </p>
              <h3 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mb-1">
                {formatCurrency(stats.carros)}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                {stats.quantidadeCarros} {stats.quantidadeCarros === 1 ? 'veículo' : 'veículos'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Caminhões */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500 text-white shadow-lg">
                <Truck className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                Caminhões
              </p>
              <h3 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-1">
                {formatCurrency(stats.caminhoes)}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {stats.quantidadeCaminhoes} {stats.quantidadeCaminhoes === 1 ? 'veículo' : 'veículos'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Motos */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg">
                <Bike className="h-6 w-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                Motos
              </p>
              <h3 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                {formatCurrency(stats.motos)}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {stats.quantidadeMotos} {stats.quantidadeMotos === 1 ? 'veículo' : 'veículos'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                Distribuição de Valor FIPE por Categoria
              </h3>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Visualização da composição da frota por valor de mercado
              </p>
            </div>
            <div className="flex justify-center items-center w-full -ml-4 md:ml-0">
              <ResponsiveContainer width="95%" height={200} className="md:w-full md:h-[250px]">
                <BarChart 
                  data={chartData} 
                  margin={{ 
                    top: 10, 
                    right: 5, 
                    left: 45, 
                    bottom: 10 
                  }}
                  className="md:!ml-4"
                >
                <defs>
                  <linearGradient id="colorCarros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="colorCaminhoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="colorMotos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.7}/>
                  </linearGradient>
                  <linearGradient id="colorOutros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  className="md:text-xs"
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 9 }}
                  className="md:text-[11px]"
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
                    return formatCurrency(value);
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Valor FIPE']}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#color${entry.name.replace('ã', 'a').replace('õ', 'o')})`}
                    />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum dado FIPE disponível
            </h3>
            <p className="text-sm text-gray-500">
              Configure os valores FIPE dos veículos para visualizar o dashboard
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
