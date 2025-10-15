import { useState, useMemo, useRef, useEffect } from 'react';
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
import { TrendingUp, TrendingDown, Minus, Search, DollarSign, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FipeConsultaModal } from './FipeConsultaModal';
import { FipeCacheEditModal } from './FipeCacheEditModal';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { Fuel } from '@/services/fipeApiService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FrotasFipeProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
  hasActiveFilters?: boolean;
  onVehicleUpdate?: () => void;
}

export function FrotasFipeNew({ veiculos, loading, hasActiveFilters = false, onVehicleUpdate }: FrotasFipeProps) {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<FrotaVeiculo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<FrotaVeiculo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedVehicleId, setUpdatedVehicleId] = useState<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarca, setFilterMarca] = useState<string>('all');
  const [filterModelo, setFilterModelo] = useState<string>('all');
  const [filterAno, setFilterAno] = useState<string>('all');
  const [filterCombustivel, setFilterCombustivel] = useState<string>('all');
  const [placaSortOrder, setPlacaSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

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
    let filtered = veiculos.filter(v => {
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

    // Apply placa sorting
    if (placaSortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const placaA = a.placa || '';
        const placaB = b.placa || '';
        if (placaSortOrder === 'asc') {
          return placaA.localeCompare(placaB);
        } else {
          return placaB.localeCompare(placaA);
        }
      });
    }

    return filtered;
  }, [veiculos, searchTerm, filterMarca, filterModelo, filterAno, filterCombustivel, placaSortOrder]);

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
    // Validar campos obrigatórios mínimos
    const missingFields = [];
    if (!vehicle.marca) missingFields.push('Marca');
    if (!vehicle.modelo) missingFields.push('Modelo');
    if (!vehicle.ano_modelo) missingFields.push('Ano do Modelo');
    
    if (missingFields.length > 0) {
      toast({
        title: "Dados incompletos",
        description: `O veículo precisa ter os seguintes dados cadastrados: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
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

  const handleVehicleUpdate = async (vehicleId: string, fipeValue: any) => {
    // Salvar posição do scroll atual
    scrollPositionRef.current = window.scrollY;
    
    setIsUpdating(true);
    setUpdatedVehicleId(vehicleId);
    
    try {
      const { error } = await supabase
        .from('frota_veiculos')
        .update({
          preco_fipe: fipeValue.price_value,
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast({
        title: "Valor FIPE atualizado",
        description: `Preço atualizado para ${fipeValue.price_label}`,
      });

      // Atualizar a lista de veículos
      await onVehicleUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar valor FIPE:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar o valor FIPE no banco de dados",
        variant: "destructive",
      });
    } finally {
      // Delay para mostrar animação e restaurar scroll
      setTimeout(() => {
        setIsUpdating(false);
        // Restaurar posição do scroll
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
        });
        // Remover highlight após 3 segundos
        setTimeout(() => {
          setUpdatedVehicleId(null);
        }, 3000);
      }, 600);
    }
  };

  const handleEditVehicle = (vehicle: FrotaVeiculo) => {
    setVehicleToEdit(vehicle);
    setEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    // Buscar apenas o veículo atualizado
    if (!vehicleToEdit) return;
    
    // Salvar posição do scroll atual
    scrollPositionRef.current = window.scrollY;
    
    setIsUpdating(true);
    setUpdatedVehicleId(vehicleToEdit.id);
    
    try {
      const { data: updatedVehicle } = await supabase
        .from('frota_veiculos')
        .select('*')
        .eq('id', vehicleToEdit.id)
        .single();

      if (updatedVehicle) {
        // Atualizar apenas este veículo na lista pai
        await onVehicleUpdate?.();
      }
    } catch (error) {
      console.error('Erro ao buscar veículo atualizado:', error);
    } finally {
      // Delay para mostrar animação suave e restaurar scroll
      setTimeout(() => {
        setIsUpdating(false);
        // Restaurar posição do scroll
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
        });
        // Remover highlight após 3 segundos
        setTimeout(() => {
          setUpdatedVehicleId(null);
        }, 3000);
      }, 600);
    }
  };

  if (loading) {
  return (
    <div className="space-y-4 relative">
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
    <div className="space-y-4 relative" ref={containerRef}>
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-2xl shadow-2xl border animate-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">
                Atualizando dados
              </p>
              <p className="text-sm text-muted-foreground animate-pulse">
                Aguarde um momento...
              </p>
            </div>
          </div>
        </div>
      )}

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
              <TableHead>
                <button
                  onClick={() => {
                    setPlacaSortOrder(prev => 
                      prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'
                    );
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Placa
                  {placaSortOrder === 'none' && <ArrowUpDown className="h-4 w-4" />}
                  {placaSortOrder === 'asc' && <ArrowUp className="h-4 w-4" />}
                  {placaSortOrder === 'desc' && <ArrowDown className="h-4 w-4" />}
                </button>
              </TableHead>
              <TableHead>Código FIPE</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead className="text-right">Valor NF</TableHead>
              <TableHead className="text-right">FIPE Atual</TableHead>
              <TableHead className="text-center" colSpan={2}>Ações</TableHead>
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
                <TableRow 
                  key={veiculo.id}
                  className={`transition-all duration-500 ${
                    updatedVehicleId === veiculo.id 
                      ? 'bg-primary/10 shadow-[0_0_0_2px] shadow-primary/30 animate-in fade-in zoom-in-95 duration-500' 
                      : ''
                  }`}
                >
                  <TableCell>
                    <div className="font-medium">{veiculo.marca || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{veiculo.modelo || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="font-mono">{veiculo.placa || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {veiculo.codigo_fipe || veiculo.codigo || '-'}
                    </span>
                  </TableCell>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditVehicle(veiculo)}
                      title="Editar dados FIPE"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConsultarFipe(veiculo)}
                      disabled={!veiculo.marca || !veiculo.modelo || !veiculo.ano_modelo}
                      title={!veiculo.marca || !veiculo.modelo || !veiculo.ano_modelo 
                        ? "Dados incompletos: precisa de Marca, Modelo e Ano" 
                        : "Consultar valor FIPE"}
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
       selectedVehicle.ano_modelo && (
        <FipeConsultaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          vehicle={{
            id: selectedVehicle.id,
            placa: selectedVehicle.placa,
            marca: selectedVehicle.marca,
            modelo: selectedVehicle.modelo,
            ano_modelo: selectedVehicle.ano_modelo,
            combustivel: selectedVehicle.combustivel as Fuel | undefined,
            tipo_veiculo: selectedVehicle.tipo_veiculo || 1,
            codigo_fipe: selectedVehicle.codigo_fipe || selectedVehicle.codigo,
            preco_nf: selectedVehicle.preco_nf,
            categoria: selectedVehicle.categoria,
          }}
          onVehicleUpdate={(fipeValue) => handleVehicleUpdate(selectedVehicle.id, fipeValue)}
        />
      )}

      {vehicleToEdit && (
        <FipeCacheEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          vehicle={vehicleToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
