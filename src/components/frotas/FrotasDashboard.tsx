import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Car, PieChart as PieChartIcon, Package, Info, Gauge } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
    return <FrotasEmptyState />;
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
          loading={loading}
        />
        
        <PieCard
          title="Distribuição por Marcas"
          icon={<Car className="h-5 w-5 text-cyan-600" />}
          data={marcasData}
          colorScale={chartColors}
          loading={loading}
        />
        
        <PieCard
          title="Distribuição por Modelos"
          icon={<Package className="h-5 w-5 text-violet-600" />}
          data={modelosData}
          colorScale={chartColors}
          loading={loading}
        />
      </div>

      {/* Lista de Veículos com Filtros */}
      <Card className="border-0 dark:border shadow-sm dark:bg-card rounded-xl">
        <CardHeader className="p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg dark:text-foreground">
            <Car className="h-5 w-5" />
            Lista de Veículos ({displayVeiculos.length})
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Sobre indicadores e regras"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-80">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <Gauge className="h-4 w-4 text-primary" />
                    Tacógrafo — exclusivo para Caminhões
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    O ícone de tacógrafo aparece <strong>apenas em veículos da
                    categoria "Caminhão"</strong>, sinalizando o status da
                    vistoria bienal obrigatória (validade automática de 2 anos
                    a partir da data da última vistoria).
                  </p>
                  <div className="space-y-1.5 pt-1 border-t border-border">
                    <div className="flex items-center gap-2 text-xs">
                      <Gauge className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span><strong>OK</strong> — mais de 30 dias para vencer</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Gauge className="h-3.5 w-3.5 text-yellow-500" />
                      <span><strong>Atenção</strong> — vence em 30 dias ou menos</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Gauge className="h-3.5 w-3.5 text-destructive" />
                      <span><strong>Vencido</strong> — validade expirada</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                    Caminhões sem vistoria registrada não exibem o ícone.
                    Acesse a aba <strong>Tacógrafo</strong> no detalhe do
                    veículo para registrar vistorias.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
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
          
          <FrotasFilters
            filters={filters}
            onFilterChange={onFilterChange}
            loading={loading}
            searchLoading={searchLoading}
          />
          
          <FrotasTable
            veiculos={displayVeiculos}
            loading={loading}
            onRefetch={onRefetch || (() => {})}
            hideHeader
          />
        </CardContent>
      </Card>
    </div>
  );
}