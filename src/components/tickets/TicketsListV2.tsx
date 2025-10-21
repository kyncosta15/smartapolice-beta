import React, { useState, useMemo } from 'react';
import { TableRCorp, EmptyTableState, type TableColumn } from '@/components/ui-v2/table-rcorp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownRCorp } from '@/components/ui-v2/dropdown-rcorp';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Claim, Assistance, ClaimStatus } from '@/types/claims';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';

interface TicketsListV2Props {
  claims?: Claim[];
  assistances?: Assistance[];
  loading?: boolean;
  onViewClaim?: (id: string) => void;
  onEditClaim?: (id: string) => void;
  onDeleteClaim?: (id: string) => Promise<void>;
  className?: string;
}

type TicketItem = (Claim | Assistance) & {
  type: 'sinistro' | 'assistencia';
  displayStatus: string;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  ticketNumber: string; // Generated ticket number for display
};

const statusConfig: Record<ClaimStatus | string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aberto: { label: 'Aberto', variant: 'destructive' },
  em_regulacao: { label: 'Em Regulação', variant: 'secondary' },
  finalizado: { label: 'Finalizado', variant: 'default' },
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  em_andamento: { label: 'Em Andamento', variant: 'secondary' },
};

const columns: TableColumn[] = [
  {
    key: 'select',
    name: '',
    width: 50,
  },
  {
    key: 'ticketNumber',
    name: 'Ticket',
    width: 120,
    isRowHeader: true,
  },
  {
    key: 'type',
    name: 'Tipo',
    width: 100,
  },
  {
    key: 'veiculo',
    name: 'Veículo',
    width: 200,
  },
  {
    key: 'status',
    name: 'Status',
    width: 120,
  },
  {
    key: 'valor_estimado',
    name: 'Valor',
    width: 120,
  },
  {
    key: 'created_at',
    name: 'Data',
    width: 120,
    allowsSorting: true,
  },
  {
    key: 'actions',
    name: 'Ações',
    width: 80,
  },
];

export function TicketsListV2({
  claims = [],
  assistances = [],
  loading = false,
  onViewClaim,
  onEditClaim,
  onDeleteClaim,
  className,
}: TicketsListV2Props) {
  console.log('🔍 TicketsListV2 - Props recebidos:', {
    claimsLength: claims.length,
    assistancesLength: assistances.length,
    loading,
    claimsPreview: claims.slice(0, 2),
    assistancesPreview: assistances.slice(0, 2)
  });
  
  console.log('🔍 TicketsListV2 - Primeiros registros completos:', {
    firstClaim: claims[0],
    firstAssistance: assistances[0]
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Detectar se os dados já vêm filtrados (usado para esconder filtros desnecessários)
  const isPreFiltered = (claims.length === 0 && assistances.length > 0) || 
                        (assistances.length === 0 && claims.length > 0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [sortDescriptor, setSortDescriptor] = useState<{
    column: string;
    direction: 'ascending' | 'descending';
  }>({
    column: 'created_at',
    direction: 'descending',
  });

  // Combine and transform data
  const allItems: TicketItem[] = useMemo(() => {
    const claimItems: TicketItem[] = claims.map((claim, index) => ({
      ...claim,
      type: 'sinistro' as const,
      displayStatus: statusConfig[claim.status]?.label || claim.status,
      statusVariant: statusConfig[claim.status]?.variant || 'outline',
      ticketNumber: `SIN-${String(index + 1).padStart(4, '0')}`,
    }));

    const assistanceItems: TicketItem[] = assistances.map((assistance, index) => ({
      ...assistance,
      type: 'assistencia' as const,
      displayStatus: statusConfig[assistance.status]?.label || assistance.status,
      statusVariant: statusConfig[assistance.status]?.variant || 'outline',
      ticketNumber: `ASS-${String(index + 1).padStart(4, '0')}`,
    }));

    return [...claimItems, ...assistanceItems];
  }, [claims, assistances]);

  // Filter and search
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.ticketNumber.toLowerCase().includes(query) ||
          item.veiculo.placa.toLowerCase().includes(query) ||
          item.veiculo.marca?.toLowerCase().includes(query) ||
          item.veiculo.modelo?.toLowerCase().includes(query) ||
          item.veiculo.proprietario_nome?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [allItems, searchQuery, statusFilter, typeFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const { column, direction } = sortDescriptor;
      const aValue = a[column as keyof TicketItem];
      const bValue = b[column as keyof TicketItem];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return direction === 'ascending' ? comparison : -comparison;
    });
  }, [filteredItems, sortDescriptor]);

  const handleSort = (descriptor: { column: any; direction: 'ascending' | 'descending' }) => {
    setSortDescriptor({
      column: String(descriptor.column),
      direction: descriptor.direction,
    });
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allItems.map(item => item.id)));
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete = itemToDelete ? [itemToDelete] : Array.from(selectedIds);
      
      for (const id of idsToDelete) {
        const item = allItems.find(i => i.id === id);
        if (!item) continue;

        if (onDeleteClaim) {
          await onDeleteClaim(id);
        } else {
          if (item.type === 'sinistro') {
            await ClaimsService.deleteClaim(id);
          } else {
            await ClaimsService.deleteAssistance(id);
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: `${idsToDelete.length} registro(s) deletado(s) com sucesso.`,
      });

      setSelectedIds(new Set());
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar os registros.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const renderCell = (item: TicketItem, columnKey: any) => {
    const key = String(columnKey);
    
    switch (key) {
      case 'select':
        return (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => toggleSelectItem(item.id)}
            />
          </div>
        );
        
      case 'ticketNumber':
        return (
          <div className="font-medium">
            #{item.ticketNumber}
          </div>
        );
        
      case 'type':
        return (
          <Badge variant={item.type === 'sinistro' ? 'destructive' : 'secondary'}>
            {item.type === 'sinistro' ? 'Sinistro' : 'Assistência'}
          </Badge>
        );
        
      case 'veiculo':
        return (
          <div>
            <div className="font-medium">{item.veiculo.placa}</div>
            <div className="text-sm text-muted-foreground">
              {item.veiculo.marca} {item.veiculo.modelo}
            </div>
          </div>
        );
        
      case 'status':
        return (
          <Badge variant={item.statusVariant}>
            {item.displayStatus}
          </Badge>
        );
        
      case 'valor_estimado':
        if ('valor_estimado' in item && item.valor_estimado) {
          return (
            <div className="text-right">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(item.valor_estimado)}
            </div>
          );
        }
        return <div className="text-muted-foreground text-center">-</div>;
        
      case 'created_at':
        return (
          <div className="text-sm">
            {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        );
        
      case 'actions':
        return (
          <DropdownRCorp
            trigger={
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            items={[
              {
                id: 'view',
                label: 'Visualizar',
                icon: <Eye className="h-4 w-4" />,
                onClick: () => onViewClaim?.(item.id),
              },
              {
                id: 'edit',
                label: 'Editar',
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEditClaim?.(item.id),
              },
              {
                id: 'delete',
                label: 'Excluir',
                icon: <Trash2 className="h-4 w-4" />,
                variant: 'destructive',
                onClick: () => handleDeleteClick(item.id),
              },
            ]}
          />
        );
        
      default:
        return String(item[key as keyof TicketItem] || '');
    }
  };

  const emptyState = (
    <EmptyTableState
      title="Nenhum ticket encontrado"
      description="Não há tickets cadastrados ou que correspondam aos filtros aplicados."
      icon={<FileText className="h-12 w-12" />}
    />
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk actions bar */}
      {allItems.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === allItems.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedIds.size > 0 
                ? `${selectedIds.size} selecionado(s)` 
                : 'Selecionar todos'}
            </span>
          </div>
          
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletar {selectedIds.size} registro(s)
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ticket, placa ou proprietário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Mostrar filtro de tipo APENAS se os dados não estiverem pré-filtrados */}
        {!isPreFiltered && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="sinistro">Sinistros</SelectItem>
              <SelectItem value="assistencia">Assistências</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="em_regulacao">Em Regulação</SelectItem>
            <SelectItem value="em_analise">Em Análise</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          'Carregando tickets...'
        ) : (
          `${sortedItems.length} ticket${sortedItems.length !== 1 ? 's' : ''} encontrado${sortedItems.length !== 1 ? 's' : ''}`
        )}
      </div>

      {/* Table */}
      <TableRCorp
        columns={columns}
        items={sortedItems}
        renderCell={renderCell}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSort}
        isLoading={loading}
        emptyState={emptyState}
        density="normal"
        getRowId={(item) => item.id}
        onAction={(key) => onViewClaim?.(String(key))}
        className="border rounded-lg"
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete 
                ? 'Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.'
                : `Tem certeza que deseja deletar ${selectedIds.size} registro(s)? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}