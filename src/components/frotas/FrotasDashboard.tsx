import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FrotasTable } from './FrotasTable';
import { FrotasFilters } from './FrotasFilters';
import { FrotaVeiculo, FrotaKPIs } from '@/hooks/useFrotasData';
import { FrotaFilters } from '../GestaoFrotas';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Car, PieChart as PieChartIcon } from 'lucide-react';

// Helper functions for colors
function getRandomColor() {
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#14B8A6', // teal-500
    '#F43F5E', // rose-500
    '#A855F7', // purple-500
    '#0EA5E9', // sky-500
    '#22C55E', // green-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getCategoryColor(categoria: string) {
  const categoryColors = {
    'Passeio': '#3B82F6',      // blue-500
    'Utilitário': '#10B981',   // emerald-500
    'Caminhão': '#F59E0B',     // amber-500
    'Moto': '#EF4444',         // red-500
    'Outros': '#8B5CF6',       // violet-500
  };
  return categoryColors[categoria as keyof typeof categoryColors] || '#6B7280';
}

// Custom Legend Component for better organization
const CustomLegend = ({ payload, type }: any) => {
  if (!payload || payload.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-1 text-sm max-w-[200px] pl-2">
      {payload.map((entry: any, index: number) => {
        const name = entry?.payload?.fullName || entry.value || entry.name;
        const value = entry?.payload?.value || 0;
        const displayName = name && name.length > 18 ? `${name.substring(0, 18)}...` : name;
        
        return (
          <div 
            key={`legend-${index}`} 
            className="flex flex-col p-2 border-b border-gray-100 last:border-b-0"
            title={name && name.length > 18 ? name : undefined}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-gray-900 leading-tight text-xs">
                {displayName}
              </span>
            </div>
            <span className="text-xs text-gray-600 ml-5 mt-0.5">
              {value} veículo{value !== 1 ? 's' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface FrotasDashboardProps {
  kpis: FrotaKPIs;
  veiculos: FrotaVeiculo[];
  loading: boolean;
  searchLoading: boolean;
  onRefetch?: () => void;
  filters: FrotaFilters;
  onFilterChange: (filters: Partial<FrotaFilters>) => void;
}

export function FrotasDashboard({ kpis, veiculos, loading, searchLoading, onRefetch, filters, onFilterChange }: FrotasDashboardProps) {

  // Preparar dados para gráficos
  const categoriaData = React.useMemo(() => {
    const categorias = veiculos.reduce((acc, v) => {
      const cat = v.categoria || 'outros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      fullName: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getCategoryColor(name.charAt(0).toUpperCase() + name.slice(1))
    }));
  }, [veiculos]);

  const modelosData = React.useMemo(() => {
    const modelos = veiculos.reduce((acc, v) => {
      if (!v.modelo) return acc;
      acc[v.modelo] = (acc[v.modelo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({
        name: name,
        fullName: name,
        value,
        color: getRandomColor()
      }));
  }, [veiculos]);

  const marcasDataPie = React.useMemo(() => {
    const marcas = veiculos.reduce((acc, v) => {
      if (!v.marca) return acc;
      acc[v.marca] = (acc[v.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(marcas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({
        name,
        fullName: name,
        value,
        color: getRandomColor()
      }));
  }, [veiculos]);

  const modalidadeData = [
    { name: 'Financiado', fullName: 'Financiado', value: kpis.modalidadeDistribuicao.financiado, color: '#3B82F6' },
    { name: 'À Vista', fullName: 'À Vista', value: kpis.modalidadeDistribuicao.avista, color: '#10B981' },
    { name: 'Consórcio', fullName: 'Consórcio', value: kpis.modalidadeDistribuicao.consorcio, color: '#F59E0B' },
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
      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Categories Distribution Chart */}
        <Card className="rounded-xl border bg-white">
          <CardHeader className="pb-2 p-3 md:p-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="h-48 sm:h-56 w-full lg:w-[60%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                    >
                      {categoriaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} veículo${value !== 1 ? 's' : ''}`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-[40%]">
                <CustomLegend payload={categoriaData} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brands Distribution Chart - Pie */}
        <Card className="rounded-xl border bg-white">
          <CardHeader className="pb-2 p-3 md:p-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Distribuição por Marcas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="h-48 sm:h-56 w-full lg:w-[60%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marcasDataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {marcasDataPie.map((entry, index) => (
                        <Cell key={`marca-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} veículo${value !== 1 ? 's' : ''}`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-[40%]">
                <CustomLegend payload={marcasDataPie} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Models Distribution Chart - Pie */}
        <Card className="rounded-xl border bg-white">
          <CardHeader className="pb-2 p-3 md:p-4">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-600" />
              Distribuição por Modelos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="h-48 sm:h-56 w-full lg:w-[60%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelosData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {modelosData.map((entry, index) => (
                        <Cell key={`modelo-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} veículo${value !== 1 ? 's' : ''}`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-[40%]">
                <CustomLegend payload={modelosData} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Veículos com Filtros */}
      <Card className="border-0 shadow-sm rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Car className="h-5 w-5" />
            Lista de Veículos ({veiculos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0 space-y-4">
          <div className="relative">
            {/* Search loading overlay */}
            {searchLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  Buscando veículos...
                </div>
              </div>
            )}
            
            <FrotasFilters
              filters={filters}
              onFilterChange={onFilterChange}
              loading={loading}
            />
          </div>
          
            <div className="relative">
              {/* Search loading overlay for table */}
              {searchLoading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background rounded-lg px-4 py-2 shadow-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    Atualizando lista...
                  </div>
                </div>
              )}
              
              <FrotasTable 
                veiculos={veiculos} 
                loading={loading} 
                onRefetch={onRefetch}
                hideHeader={true}
              />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}