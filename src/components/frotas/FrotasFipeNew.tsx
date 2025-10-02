import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, Search, DollarSign, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FipeConsultaModal } from './FipeConsultaModal';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { Fuel } from '@/services/fipeApiService';

interface FrotasFipeProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
  hasActiveFilters?: boolean;
}

export function FrotasFipeNew({ veiculos, loading, hasActiveFilters = false }: FrotasFipeProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<FrotaVeiculo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState<string>('all');
  const [filterModelo, setFilterModelo] = useState<string>('all');
  const [filterAno, setFilterAno] = useState<string>('all');
  const [filterCombustivel, setFilterCombustivel] = useState<string>('all');

  // Extract unique filter options
  const marcas = useMemo(() => {
    const unique = Array.from(new Set(veiculos.map(v => v.marca).filter(Boolean)));
    return unique.sort();
  }, [veiculos]);

  const modelos = useMemo(() => {
    const unique = Array.from(new Set(veiculos.map(v => v.modelo).filter(Boolean)));
    return unique.sort();
  }, [veiculos]);

  const anos = useMemo(() => {
    const unique = Array.from(new Set(veiculos.map(v => v.ano_modelo).filter(Boolean)));
    return unique.sort((a, b) => (b || 0) - (a || 0));
  }, [veiculos]);

  const combustiveis = useMemo(() => {
    const unique = Array.from(new Set(veiculos.map(v => v.combustivel).filter(Boolean)));
    return unique.sort();
  }, [veiculos]);

  // Apply filters
  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter(v => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          v.placa?.toLowerCase().includes(term) ||
          v.marca?.toLowerCase().includes(term) ||
          v.modelo?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      if (filterMarca !== 'all' && v.marca !== filterMarca) return false;
      if (filterModelo !== 'all' && v.modelo !== filterModelo) return false;
      if (filterAno !== 'all' && v.ano_modelo?.toString() !== filterAno) return false;
      if (filterCombustivel !== 'all' && v.combustivel !== filterCombustivel) return false;

      return true;
    });
  }, [veiculos, searchTerm, filterMarca, filterModelo, filterAno, filterCombustivel]);

  const veiculosComFipe = veiculosFiltrados.filter(v => v.preco_fipe && v.preco_nf);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (veiculosComFipe.length === 0) return null;

    const valorizacaoTotal = veiculosComFipe.reduce((acc, v) => acc + (v.preco_fipe! - v.preco_nf!), 0);
    const percentualMedio = veiculosComFipe.reduce((acc, v) => {
      const diff = ((v.preco_fipe! - v.preco_nf!) / v.preco_nf!) * 100;
      return acc + diff;
    }, 0) / veiculosComFipe.length;
    
    const veiculosValorizados = veiculosComFipe.filter(v => v.preco_fipe! > v.preco_nf!).length;
    const veiculosDesvalorizados = veiculosComFipe.filter(v => v.preco_fipe! < v.preco_nf!).length;

    return {
      valorizacaoTotal,
      percentualMedio,
      veiculosValorizados,
      veiculosDesvalorizados,
    };
  }, [veiculosComFipe]);

  const handleConsultarFipe = (vehicle: FrotaVeiculo) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterMarca('all');
    setFilterModelo('all');
    setFilterAno('all');
    setFilterCombustivel('all');
  };

  const hasFilters = searchTerm || filterMarca !== 'all' || filterModelo !== 'all' || 
                     filterAno !== 'all' || filterCombustivel !== 'all';

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Search className="w-4 h-4" />
              Filtros
            </h3>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar placa, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterMarca} onValueChange={setFilterMarca}>
              <SelectTrigger>
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Marcas</SelectItem>
                {marcas.map((marca) => (
                  <SelectItem key={marca} value={marca!}>
                    {marca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterModelo} onValueChange={setFilterModelo}>
              <SelectTrigger>
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Modelos</SelectItem>
                {modelos.map((modelo) => (
                  <SelectItem key={modelo} value={modelo!}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAno} onValueChange={setFilterAno}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Anos</SelectItem>
                {anos.map((ano) => (
                  <SelectItem key={ano} value={ano!.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCombustivel} onValueChange={setFilterCombustivel}>
              <SelectTrigger>
                <SelectValue placeholder="Combustível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {combustiveis.map((comb) => (
                  <SelectItem key={comb} value={comb!}>
                    {comb}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {veiculosFiltrados.length} de {veiculos.length} veículos
          </div>
        </div>
      </Card>

      {/* Comparison Stats */}
      {veiculosComFipe.length > 0 && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Valorização Total</div>
            <div className={`text-2xl font-bold ${stats.valorizacaoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Math.abs(stats.valorizacaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Média de Diferença</div>
            <div className="text-2xl font-bold">
              {stats.percentualMedio.toFixed(2)}%
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Valorizados</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.veiculosValorizados}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Desvalorizados</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.veiculosDesvalorizados}
            </div>
          </Card>
        </div>
      )}

      {/* Vehicles Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead className="text-right">Valor NF</TableHead>
              <TableHead className="text-right">FIPE Atual</TableHead>
              <TableHead className="text-center">Cache</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {veiculosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {hasFilters ? 'Nenhum veículo encontrado com os filtros aplicados' : 'Nenhum veículo disponível'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              veiculosFiltrados.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell>
                    <div className="font-medium">{veiculo.marca || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{veiculo.modelo || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="font-mono">{veiculo.placa || 'N/A'}</TableCell>
                  <TableCell>{veiculo.ano_modelo || 'N/A'}</TableCell>
                  <TableCell>{veiculo.combustivel || 'N/A'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {veiculo.preco_nf 
                      ? `R$ ${veiculo.preco_nf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {veiculo.preco_fipe 
                      ? `R$ ${veiculo.preco_fipe.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    {veiculo.preco_fipe ? (
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Cache
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConsultarFipe(veiculo)}
                      disabled={!veiculo.marca || !veiculo.modelo || !veiculo.ano_modelo}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Consultar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedVehicle && 
       selectedVehicle.marca && 
       selectedVehicle.modelo && 
       selectedVehicle.ano_modelo && 
       selectedVehicle.combustivel && (
        <FipeConsultaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          vehicle={{
            id: selectedVehicle.id,
            placa: selectedVehicle.placa,
            marca: selectedVehicle.marca,
            modelo: selectedVehicle.modelo,
            ano_modelo: selectedVehicle.ano_modelo,
            combustivel: selectedVehicle.combustivel as Fuel,
            tipo_veiculo: selectedVehicle.tipo_veiculo || 1,
            codigo_fipe: selectedVehicle.codigo_fipe,
            preco_nf: selectedVehicle.preco_nf,
          }}
        />
      )}
    </div>
  );
}
