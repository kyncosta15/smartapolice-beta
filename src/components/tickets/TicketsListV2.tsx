import React, { useState, useMemo } from 'react';
import { TableRCorp, EmptyTableState, type TableColumn } from '@/components/ui-v2/table-rcorp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, FileText, AlertTriangle, Wrench, Clock, Trash2, User, Car, Paperclip } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Claim, Assistance, ClaimStatus } from '@/types/claims';
import { ClaimsService } from '@/services/claims';
import { useToast } from '@/hooks/use-toast';
import { EditTicketModal } from '@/components/tickets/EditTicketModal';
import { StatusStepperModal } from '@/components/sinistros/StatusStepperModal';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Ticket } from '@/types/tickets';

interface TicketsListV2Props {
  claims?: Claim[];
  assistances?: Assistance[];
  loading?: boolean;
  onViewClaim?: (id: string) => void;
  onEditClaim?: (id: string) => void;
  onDeleteClaim?: (id: string) => Promise<void>;
  // Chamado após uma ou mais exclusões concluídas com sucesso
  onItemsDeleted?: () => void;
  className?: string;
}

type TicketItem = (Claim | Assistance) & {
  type: 'sinistro' | 'assistencia';
  displayStatus: string;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  ticketNumber: string; // Generated ticket number for display
  segurado_nome?: string;
};

// Função para formatar status removendo underscores e capitalizando
const formatStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
    key: 'ticket',
    name: 'Ticket',
    width: 250,
    isRowHeader: true,
  },
  {
    key: 'veiculo',
    name: 'Veículo',
    width: 260,
  },
  {
    key: 'subsidiaria',
    name: 'Sub',
    width: 130,
  },
  {
    key: 'subtipo',
    name: 'Tipo de Sinistro',
    width: 170,
  },
  {
    key: 'status',
    name: 'Status',
    width: 140,
  },
  {
    key: 'valor_estimado',
    name: 'Valor',
    width: 150,
  },
  {
    key: 'observacoes',
    name: 'Anexos',
    width: 200,
  },
  {
    key: 'created_at',
    name: 'Data',
    width: 120,
    allowsSorting: true,
  },
];

export function TicketsListV2({
  claims = [],
  assistances = [],
  loading = false,
  onViewClaim,
  onEditClaim,
  onDeleteClaim,
  onItemsDeleted,
  className,
}: TicketsListV2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [statusStepperOpen, setStatusStepperOpen] = useState(false);
  const [statusStepperTicketId, setStatusStepperTicketId] = useState<string | null>(null);
  const [statusStepperType, setStatusStepperType] = useState<'sinistro' | 'assistencia'>('sinistro');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Detectar se os dados já vêm filtrados (usado para esconder filtros desnecessários)
  const isPreFiltered = (claims.length === 0 && assistances.length > 0) || 
                        (assistances.length === 0 && claims.length > 0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      displayStatus: statusConfig[claim.status]?.label || formatStatusLabel(claim.status),
      statusVariant: statusConfig[claim.status]?.variant || 'outline',
      ticketNumber: `SIN-${String(index + 1).padStart(4, '0')}`,
      segurado_nome: claim.segurado_nome,
    }));

    const assistanceItems: TicketItem[] = assistances.map((assistance, index) => ({
      ...assistance,
      type: 'assistencia' as const,
      displayStatus: statusConfig[assistance.status]?.label || formatStatusLabel(assistance.status),
      statusVariant: statusConfig[assistance.status]?.variant || 'outline',
      ticketNumber: `ASS-${String(index + 1).padStart(4, '0')}`,
      segurado_nome: assistance.segurado_nome,
    }));

    const result = [...claimItems, ...assistanceItems];

    return result;
  }, [claims, assistances]);

  // Buscar contagem real de anexos para todos os tickets visíveis
  const ticketIds = useMemo(() => allItems.map(i => i.id).filter(Boolean) as string[], [allItems]);
  const { data: attachmentCounts = {} } = useQuery({
    queryKey: ['ticket-attachment-counts', ticketIds],
    queryFn: async () => {
      if (ticketIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('ticket_id')
        .in('ticket_id', ticketIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.ticket_id) counts[row.ticket_id] = (counts[row.ticket_id] || 0) + 1;
      });
      return counts;
    },
    enabled: ticketIds.length > 0,
    staleTime: 30_000,
  });

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
          item.veiculo.proprietario_nome?.toLowerCase().includes(query) ||
          item.segurado_nome?.toLowerCase().includes(query) ||
          (item as any).subsidiaria?.toLowerCase().includes(query);
        
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

  const handleEditClick = async (itemId: string) => {
    setIsLoadingTicket(true);
    try {
      const item = allItems.find(i => i.id === itemId);
      if (!item) return;

      // Buscar dados completos do banco
      const fullClaim = await ClaimsService.getClaimById(itemId);
      
      // Converter para formato de Ticket
      const ticket: Ticket = {
        id: fullClaim.id,
        protocol_code: fullClaim.ticket,
        tipo: item.type,
        subtipo: (fullClaim.subtipo || '') as any,
        status: fullClaim.status as any,
        data_evento: fullClaim.data_evento || new Date().toISOString(),
        valor_estimado: fullClaim.valor_estimado,
        localizacao: fullClaim.localizacao || '',
        descricao: '',
        gravidade: 'media' as any,
        vehicle_id: fullClaim.veiculo.id,
        empresa_id: '',
        origem: 'portal' as any,
        payload: {},
        created_at: fullClaim.created_at,
        updated_at: fullClaim.updated_at,
      };

      setEditingTicket(ticket);
      setIsEditModalOpen(true);
      
      if (onEditClaim) {
        onEditClaim(itemId);
      }
    } catch (error) {
      console.error('Erro ao carregar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do ticket.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const handleEditSuccess = () => {
    // Invalidar queries para recarregar dados
    queryClient.invalidateQueries({ queryKey: ['claims'] });
    
    toast({
      title: 'Sucesso',
      description: 'Ticket atualizado com sucesso!',
    });
  };

  const handleStatusTrackingClick = (itemId: string, type: 'sinistro' | 'assistencia') => {
    setStatusStepperTicketId(itemId);
    setStatusStepperType(type);
    setStatusStepperOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete = itemToDelete ? [itemToDelete] : Array.from(selectedIds);
      
      console.log('🗑️ Iniciando exclusão de', idsToDelete.length, 'registros');
      
      // Deletar todos em paralelo ao invés de sequencial para melhor performance
      const deletePromises = idsToDelete.map(async (id) => {
        try {
          const item = allItems.find(i => i.id === id);
          if (!item) {
            console.warn('⚠️ Item não encontrado:', id);
            return { success: false, id, error: 'Item não encontrado' };
          }

          if (onDeleteClaim) {
            await onDeleteClaim(id);
          } else {
            if (item.type === 'sinistro') {
              await ClaimsService.deleteClaim(id);
            } else {
              await ClaimsService.deleteAssistance(id);
            }
          }
          
          console.log('✅ Registro deletado:', id);
          return { success: true, id };
        } catch (error) {
          console.error('❌ Erro ao deletar registro:', id, error);
          return { success: false, id, error };
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['claims'] });

      // Notificar o container para recarregar dados/estatísticas, se necessário
      onItemsDeleted?.();

      if (failCount === 0) {
        toast({
          title: 'Sucesso',
          description: `${successCount} registro(s) deletado(s) com sucesso.`,
        });
      } else if (successCount > 0) {
        toast({
          title: 'Parcialmente concluído',
          description: `${successCount} registro(s) deletado(s). ${failCount} falharam.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível deletar nenhum registro.',
          variant: 'destructive',
        });
      }

      setSelectedIds(new Set());
      setItemToDelete(null);
    } catch (error) {
      console.error('❌ Erro crítico ao deletar:', error);
      toast({
        title: 'Erro',
        description: 'Erro crítico ao processar a exclusão.',
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
          <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => toggleSelectItem(item.id)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        );
        
      case 'ticket':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                item.type === 'sinistro' ? "bg-red-500" : "bg-blue-500"
              )} />
              <span className="font-mono font-bold text-sm tracking-tight">
                {item.ticketNumber}
              </span>
            </div>
            {(item.segurado_nome || item.veiculo.proprietario_nome) && (
              <div className="text-xs text-muted-foreground truncate pl-4">
                <span className="font-semibold">Segurado:</span> {item.segurado_nome || item.veiculo.proprietario_nome}
              </div>
            )}
            <div className="flex items-center gap-1.5 pl-4">
              {item.type === 'sinistro' ? (
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              ) : (
                <Wrench className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              )}
              <Badge 
                variant={item.type === 'sinistro' ? 'destructive' : 'default'}
                className="font-medium text-xs"
              >
                {item.type === 'sinistro' ? 'Sinistro' : 'Assistência'}
              </Badge>
            </div>
          </div>
        );
        
      case 'veiculo':
        const isBeneficiario = !item.veiculo.placa || item.veiculo.placa === 'N/A';
        const beneficiarioNome = (item as any).beneficiario_nome || item.segurado_nome;
        
        if (isBeneficiario && beneficiarioNome) {
          return (
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                  Beneficiário
                </Badge>
              </div>
              <div className="text-sm font-semibold truncate pl-5">
                {beneficiarioNome}
              </div>
            </div>
          );
        }
        
        if (isBeneficiario) {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:text-purple-300">
                Beneficiário
              </Badge>
            </div>
          );
        }
        
        return (
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="font-bold text-sm tracking-wide truncate">{item.veiculo.placa}</span>
            </div>
            {(item.veiculo.marca || item.veiculo.modelo) && (
              <div className="text-xs text-muted-foreground truncate pl-5">
                {item.veiculo.marca} {item.veiculo.modelo}
              </div>
            )}
            {item.veiculo.proprietario_nome && (
              <div className="text-xs text-muted-foreground truncate pl-5 flex items-center gap-1">
                <span className="opacity-70">•</span>
                <span className="truncate">{item.veiculo.proprietario_nome}</span>
              </div>
            )}
          </div>
        );
        
      case 'subsidiaria': {
        const sub = (item as any).subsidiaria as string | undefined;
        if (!sub) {
          return <span className="text-xs text-muted-foreground italic">—</span>;
        }
        return (
          <Badge
            variant="outline"
            className="font-medium text-xs border-primary/30 bg-primary/5 text-foreground"
          >
            {sub}
          </Badge>
        );
      }

      case 'subtipo': {
        const subtipo = (item as any).subtipo as string | undefined;
        if (!subtipo) {
          return <span className="text-xs text-muted-foreground italic">—</span>;
        }
        const label = subtipo
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <Badge
            variant="outline"
            className="font-medium text-xs border-primary/30 bg-primary/5 text-foreground"
          >
            {label}
          </Badge>
        );
      }

      case 'status':
        const statusColors: Record<string, string> = {
          'aberto': 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
          'em_regulacao': 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
          'em_analise': 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
          'finalizado': 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
        };

        const isBeneficiarioStatus = !item.veiculo.placa || item.veiculo.placa === 'N/A';
        const statusIndenizacao = 'status_indenizacao' in item ? (item as any).status_indenizacao : null;
        
        if (isBeneficiarioStatus && statusIndenizacao) {
          const indenizacaoColors: Record<string, string> = {
            'indenizado': 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
            'pendente': 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
            'negado': 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
          };
          const indenizacaoLabels: Record<string, string> = {
            'indenizado': 'Indenizado',
            'pendente': 'Pendente',
            'negado': 'Negado',
          };
          return (
            <Badge 
              className={cn(
                "font-semibold border-2 shadow-sm",
                indenizacaoColors[statusIndenizacao] || "border-gray-500 bg-gray-50 text-gray-700"
              )}
            >
              {indenizacaoLabels[statusIndenizacao] || statusIndenizacao}
            </Badge>
          );
        }
        
        return (
          <Badge 
            className={cn(
              "font-semibold border-2 shadow-sm",
              statusColors[item.status] || "border-gray-500 bg-gray-50 text-gray-700"
            )}
          >
            {item.displayStatus}
          </Badge>
        );
        
      case 'valor_estimado':
        const valorPago = 'valor_pago' in item ? (item as any).valor_pago : null;
        const valorEstimado = 'valor_estimado' in item ? (item as any).valor_estimado : null;
        const valorExibir = valorPago ?? valorEstimado;
        
        if (valorExibir) {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "p-1.5 rounded-md flex-shrink-0",
                valorPago ? "bg-blue-100 dark:bg-blue-950" : "bg-green-100 dark:bg-green-950"
              )}>
                <span className={cn(
                  "text-xs font-bold",
                  valorPago ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"
                )}>R$</span>
              </div>
              <span className="font-bold text-sm tabular-nums truncate">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(valorExibir)}
              </span>
            </div>
          );
        }
        return <span className="text-muted-foreground text-xs">—</span>;
        
      case 'observacoes': {
        const attachments = (item as any).attachments || [];
        const fallbackCount = Array.isArray(attachments) ? attachments.length : 0;
        const docCount = attachmentCounts[item.id] ?? fallbackCount;

        return (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center">
                  <div className="relative inline-flex">
                    <Paperclip
                      className={cn(
                        'h-5 w-5',
                        docCount > 0 ? 'text-primary' : 'text-muted-foreground/60'
                      )}
                    />
                    {docCount > 0 && (
                      <span
                        className={cn(
                          'absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1',
                          'flex items-center justify-center rounded-full',
                          'bg-destructive text-destructive-foreground',
                          'text-[10px] font-bold leading-none tabular-nums',
                          'ring-2 ring-background'
                        )}
                      >
                        {docCount > 99 ? '99+' : docCount}
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {docCount === 0
                  ? 'Sem anexos'
                  : `${docCount} documento${docCount > 1 ? 's' : ''} anexado${docCount > 1 ? 's' : ''}`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
        
      case 'created_at':
        return (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="tabular-nums font-medium">
              {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
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
        <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-muted/80 to-muted/40 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === allItems.length}
              onCheckedChange={toggleSelectAll}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm font-semibold">
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
              className="gap-2 shadow-md hover:shadow-lg transition-shadow"
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
            placeholder="Buscar por ticket, placa, proprietário, segurado ou sub..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
          />
        </div>
        
        {/* Mostrar filtro de tipo APENAS se os dados não estiverem pré-filtrados */}
        {!isPreFiltered && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background/50 backdrop-blur-sm border-border/50">
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
          <SelectTrigger className="w-full sm:w-40 bg-background/50 backdrop-blur-sm border-border/50">
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
      <div className="flex items-center gap-2 px-1">
        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">
          {loading ? (
            'Carregando tickets...'
          ) : (
            `${sortedItems.length} ticket${sortedItems.length !== 1 ? 's' : ''} encontrado${sortedItems.length !== 1 ? 's' : ''}`
          )}
        </span>
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

      {/* Edit ticket modal */}
      <EditTicketModal
        ticket={editingTicket}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Status tracking modal */}
      <StatusStepperModal
        open={statusStepperOpen}
        onOpenChange={setStatusStepperOpen}
        ticketId={statusStepperTicketId}
        ticketType={statusStepperType}
      />
    </div>
  );
}