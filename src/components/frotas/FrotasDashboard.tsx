import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FrotasTable } from './FrotasTable';
import { FrotasFilters } from './FrotasFilters';
import { FrotaVeiculo, FrotaKPIs } from '@/hooks/useFrotasData';
import { FrotaFilters } from '../GestaoFrotas';
import { Car, PieChart as PieChartIcon, Package } from 'lucide-react';
import PieCard from '@/components/charts/PieCard';
import { shouldUseUIV2 } from '@/config/features';
// Phase 1 - UI V2 components
import { FrotasTableV2 } from './FrotasTableV2';

// Consistent color palette for all charts
const chartColors = [
  "#4F46E5", // indigo-600
  "#06B6D4", // cyan-500  
  "#84CC16", // lime-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#22C55E", // green-500
  "#3B82F6", // blue-500
  "#F43F5E", // rose-500
  "#14B8A6", // teal-500
];

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
      const cat = v.categoria || 'Outros';
      const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      acc[normalizedCat] = (acc[normalizedCat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias).map(([name, count]) => ({
      name,
      count
    }));
  }, [veiculos]);

  const marcasData = React.useMemo(() => {
    const marcas = veiculos.reduce((acc, v) => {
      if (!v.marca) return acc;
      acc[v.marca] = (acc[v.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(marcas).map(([name, count]) => ({
      name,
      count
    }));
  }, [veiculos]);

  const modelosData = React.useMemo(() => {
    const modelos = veiculos.reduce((acc, v) => {
      if (!v.modelo) return acc;
      acc[v.modelo] = (acc[v.modelo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelos).map(([name, count]) => ({
      name,
      count
    }));
  }, [veiculos]);

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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        <PieCard
          title="Distribuição por Categoria"
          icon={<PieChartIcon className="h-5 w-5 text-blue-600" />}
          data={categoriaData}
          colorScale={chartColors}
        />
        
        <PieCard
          title="Distribuição por Marcas"
          icon={<Car className="h-5 w-5 text-cyan-600" />}
          data={marcasData}
          colorScale={chartColors}
        />
        
        <PieCard
          title="Distribuição por Modelos"
          icon={<Package className="h-5 w-5 text-violet-600" />}
          data={modelosData}
          colorScale={chartColors}
        />
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
              
              {/* Feature Flag: Use V2 or V1 table based on flag */}
              {shouldUseUIV2('frotas') ? (
                <FrotasTableV2 
                  veiculos={veiculos} 
                  loading={loading} 
                  onRefetch={onRefetch}
                  hideHeader={true}
                />
              ) : (
                <FrotasTable 
                  veiculos={veiculos} 
                  loading={loading} 
                  onRefetch={onRefetch}
                  hideHeader={true}
                />
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}