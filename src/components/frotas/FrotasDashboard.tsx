import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Car, PieChart as PieChartIcon, Package } from 'lucide-react';
import { FrotasTable } from './FrotasTable';
import { FrotasFilters } from './FrotasFilters';
import { FrotaVeiculo, FrotaKPIs } from '@/hooks/useFrotasData';
import { FrotaFilters } from '../GestaoFrotas';
import PieCard from '@/components/charts/PieCard';
import { shouldUseUIV2 } from '@/config/features';
// Phase 1 - UI V2 components
import { FrotasEmptyState } from './FrotasEmptyState';

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
  allVeiculos: FrotaVeiculo[];
  loading: boolean;
  searchLoading: boolean;
  onRefetch?: () => void;
  filters: FrotaFilters;
  onFilterChange: (filters: Partial<FrotaFilters>) => void;
}

export function FrotasDashboard({ kpis, veiculos, allVeiculos, loading, searchLoading, onRefetch, filters, onFilterChange }: FrotasDashboardProps) {
  // Determinar se há filtros ativos e se a busca retornou 0 resultados
  const hasActiveFilters = filters.search !== '' || filters.categoria.length > 0 || filters.status.length > 0 || filters.marcaModelo.length > 0;
  const noResultsFound = hasActiveFilters && veiculos.length === 0 && allVeiculos.length > 0;
  
  // Usar veiculos filtrados se houver, senão usar todos
  const displayVeiculos = noResultsFound ? allVeiculos : veiculos;

  // Preparar dados para gráficos usando displayVeiculos
  const categoriaData = React.useMemo(() => {
    const categorias = displayVeiculos.reduce((acc, v) => {
      const cat = v.categoria || 'Outros';
      const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      acc[normalizedCat] = (acc[normalizedCat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorias).map(([name, count]) => ({
      name,
      count
    }));
  }, [displayVeiculos]);

  const marcasData = React.useMemo(() => {
    const marcas = displayVeiculos.reduce((acc, v) => {
      if (!v.marca) return acc;
      acc[v.marca] = (acc[v.marca] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(marcas).map(([name, count]) => ({
      name,
      count
    }));
  }, [displayVeiculos]);

  const modelosData = React.useMemo(() => {
    const modelos = displayVeiculos.reduce((acc, v) => {
      if (!v.modelo) return acc;
      acc[v.modelo] = (acc[v.modelo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelos).map(([name, count]) => ({
      name,
      count
    }));
  }, [displayVeiculos]);

  // Estado vazio - mostrar quando não há dados E não tem filtros ativos
  if (!loading && Array.isArray(allVeiculos) && allVeiculos.length === 0 && !hasActiveFilters) {
    return (
      <FrotasEmptyState 
        onUploadClick={() => {}} 
        onCreateClick={() => {}}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 2xl:grid-cols-3">
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
      <Card className="border-0 dark:border shadow-sm dark:bg-card rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg dark:text-foreground">
            <Car className="h-5 w-5" />
            Lista de Veículos ({displayVeiculos.length})
            {noResultsFound && (
              <Badge variant="secondary" className="ml-2">
                Mostrando todos - busca sem resultados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0 space-y-4">
          {/* Alert quando busca não retorna resultados */}
          {noResultsFound && (
            <Alert className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Nenhum resultado encontrado para "{filters.search}"</strong>
                <p className="text-sm mt-1">Mostrando todos os {allVeiculos.length} veículos disponíveis. Ajuste sua busca para filtrar os resultados.</p>
              </AlertDescription>
            </Alert>
          )}
          
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
              searchLoading={searchLoading}
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
            veiculos={displayVeiculos}
            loading={loading}
            onRefetch={onRefetch || (() => {})}
            hideHeader
          />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}