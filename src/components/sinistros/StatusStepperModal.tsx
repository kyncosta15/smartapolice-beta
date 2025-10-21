import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2,
  Circle,
  Clock,
  X,
  Loader2,
  AlertTriangle,
  Wrench,
  Edit2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StatusStepperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string | null;
  ticketType: 'sinistro' | 'assistencia';
}

interface StatusStep {
  status: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  order: number;
}

interface TicketMovement {
  id: string;
  tipo: string;
  created_at: string;
  payload: any;
}

// Etapas para sinistros
const SINISTRO_STEPS = [
  { status: 'aberto', label: 'Aberto', order: 1 },
  { status: 'analise_seguradora', label: 'Análise na Seguradora', order: 2 },
  { status: 'aguardando_documento', label: 'Aguardando Documento', order: 3 },
  { status: 'aguardando_vistoria', label: 'Aguardando Vistoria', order: 4 },
  { status: 'na_oficina', label: 'Na Oficina', order: 5 },
  { status: 'aguardando_peca', label: 'Aguardando Peça', order: 6 },
  { status: 'aguardando_reparo', label: 'Aguardando Reparo', order: 7 },
  { status: 'processo_liquidacao', label: 'Processo de Liquidação', order: 8 },
  { status: 'carro_reserva', label: 'Carro Reserva', order: 9 },
  { status: 'lucros_cessantes', label: 'Lucros Cessantes', order: 10 },
  { status: 'dc_danos_corporais', label: 'DC - Danos Corporais', order: 11 },
  { status: 'acordo', label: 'Acordo', order: 12 },
  { status: 'finalizado_reparado', label: 'Finalizado Reparado', order: 13 },
  { status: 'finalizado_com_indenizacao', label: 'Finalizado com Indenização', order: 14 },
  { status: 'finalizado_sem_indenizacao', label: 'Finalizado sem Indenização', order: 15 },
  { status: 'finalizado_inatividade', label: 'Finalizado (inatividade cor/seg)', order: 16 },
];

// Etapas para assistências
const ASSISTENCIA_STEPS = [
  { status: 'aberto', label: 'Aberto', order: 1 },
  { status: 'atendimento_andamento', label: 'Atendimento em Andamento', order: 2 },
  { status: 'saida_base', label: 'Saída de Base', order: 3 },
  { status: 'aguardando_prestador', label: 'Aguardando Prestador', order: 4 },
  { status: 'aguardando_vistoria', label: 'Aguardando Vistoria', order: 5 },
  { status: 'aguardando_peca', label: 'Aguardando Peça', order: 6 },
  { status: 'aguardando_documentos', label: 'Aguardando Documentos', order: 7 },
  { status: 'aguardando_retorno', label: 'Aguardando Retorno (Segurado/Corretor)', order: 8 },
  { status: 'aguardando_reparo', label: 'Aguardando Reparo', order: 9 },
  { status: 'vidros', label: 'Vidros', order: 10 },
  { status: 'reembolso', label: 'Reembolso', order: 11 },
  { status: 'finalizado', label: 'Finalizado', order: 12 },
  { status: 'finalizado_inatividade', label: 'Finalizado (inatividade cor/seg)', order: 13 },
];

export function StatusStepperModal({
  open,
  onOpenChange,
  ticketId,
  ticketType,
}: StatusStepperModalProps) {
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [movements, setMovements] = useState<TicketMovement[]>([]);
  const [steps, setSteps] = useState<StatusStep[]>([]);
  const [editingStep, setEditingStep] = useState<StatusStep | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && ticketId) {
      loadTicketData();
    }
  }, [open, ticketId]);

  const loadTicketData = async () => {
    if (!ticketId) return;

    setLoading(true);
    try {
      // Buscar dados do ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;
      setTicketData(ticket);

      // Buscar movimentos do ticket
      const { data: movementsData, error: movementsError } = await supabase
        .from('ticket_movements')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (movementsError) throw movementsError;
      setMovements(movementsData || []);

      // Processar steps
      processSteps(ticket, movementsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSteps = (ticket: any, movementsData: TicketMovement[]) => {
    const stepsTemplate = ticketType === 'sinistro' ? SINISTRO_STEPS : ASSISTENCIA_STEPS;
    const currentStatus = ticket.status;
    
    // Mapear movimentos de status para timestamps
    const statusTimestamps: Record<string, string> = {};
    movementsData.forEach(movement => {
      if (movement.tipo === 'status_change' && movement.payload?.status_novo) {
        statusTimestamps[movement.payload.status_novo] = movement.created_at;
      }
    });

    // Adicionar timestamp do status de criação
    statusTimestamps['aberto'] = ticket.created_at;

    // Criar steps processados - marcar como completo apenas se passou por ele
    const processedSteps: StatusStep[] = stepsTemplate.map(step => ({
      ...step,
      completed: step.status === currentStatus || !!statusTimestamps[step.status],
      timestamp: statusTimestamps[step.status],
    }));

    setSteps(processedSteps);
  };

  const getProgressPercentage = () => {
    if (!steps.length) return 0;
    const completedCount = steps.filter(s => s.completed).length;
    return Math.round((completedCount / steps.length) * 100);
  };

  const getStatusColor = (status: string) => {
    // Cores baseadas na imagem de referência
    const colors: Record<string, string> = {
      // Sinistros
      'aberto': 'bg-blue-600',
      'finalizado_com_indenizacao': 'bg-green-600',
      'na_oficina': 'bg-blue-800',
      'aguardando_peca': 'bg-amber-900',
      'aguardando_vistoria': 'bg-amber-200',
      'aguardando_documento': 'bg-gray-500',
      'analise_seguradora': 'bg-blue-900',
      'processo_liquidacao': 'bg-orange-600',
      'finalizado_sem_indenizacao': 'bg-black',
      'finalizado_inatividade': 'bg-red-600',
      'carro_reserva': 'bg-pink-300',
      'lucros_cessantes': 'bg-pink-500',
      'dc_danos_corporais': 'bg-teal-500',
      'acordo': 'bg-lime-500',
      'aguardando_reparo': 'bg-blue-800',
      'finalizado_reparado': 'bg-green-600',
      
      // Assistências
      'finalizado': 'bg-green-600',
      'reembolso': 'bg-green-400',
      'aguardando_prestador': 'bg-purple-700',
      'atendimento_andamento': 'bg-yellow-500',
      'aguardando_documentos': 'bg-lime-600',
      'saida_base': 'bg-blue-800',
      'aguardando_retorno': 'bg-gray-600',
      'vidros': 'bg-yellow-400',
    };
    
    return colors[status] || 'bg-gray-500';
  };

  const getLastActivity = () => {
    if (!movements.length) return null;
    const lastMovement = movements[movements.length - 1];
    return {
      status: lastMovement.payload?.status_novo || 'aberto',
      timestamp: lastMovement.created_at,
    };
  };

  const isFinalizado = ticketData?.status === 'finalizado';
  const isCancelado = ticketData?.status === 'cancelado';
  const progress = getProgressPercentage();
  const lastActivity = getLastActivity();

  const handleStepClick = (step: StatusStep) => {
    setEditingStep(step);
    setEditDescription('');
  };

  const handleUpdateStatus = async () => {
    if (!editingStep || !ticketId) return;

    setIsUpdating(true);
    try {
      const previousStatus = ticketData.status;

      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: editingStep.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Criar movimento
      await supabase
        .from('ticket_movements')
        .insert({
          ticket_id: ticketId,
          tipo: 'status_change',
          payload: {
            status_anterior: previousStatus,
            status_novo: editingStep.status,
            descricao: editDescription || `Status alterado para "${editingStep.label}"`,
            motivo: editDescription,
          },
        });

      toast({
        title: 'Status atualizado',
        description: `Status alterado para "${editingStep.label}"`,
      });

      // Recarregar dados
      await loadTicketData();
      setEditingStep(null);
      setEditDescription('');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {ticketType === 'sinistro' ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Wrench className="h-5 w-5 text-blue-600" />
              )}
              {ticketType === 'sinistro' ? 'Sinistro' : 'Assistência'} #{ticketData?.id?.slice(0, 8)}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando informações...</p>
          </div>
        ) : ticketData ? (
          <div className="space-y-6 py-4">
            {/* Progress Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-3 w-3 rounded-full",
                    isFinalizado ? "bg-green-500" : isCancelado ? "bg-red-500" : "bg-blue-500"
                  )} />
                  <span className="font-semibold">
                    {ticketType === 'sinistro' ? 'Sinistro' : 'Assistência'}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {progress}% completo
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isFinalizado ? "bg-green-500" : isCancelado ? "bg-red-500" : "bg-blue-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Status badge */}
              <div>
                <Badge
                  variant={isFinalizado ? 'default' : isCancelado ? 'destructive' : 'secondary'}
                  className="text-sm font-semibold"
                >
                  {isFinalizado ? 'Finalizado' : isCancelado ? 'Cancelado' : 'Em andamento'}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Steps timeline */}
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
              {steps.map((step, index) => (
                <div key={step.status} className="flex items-start gap-3 py-2 group">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <button
                      onClick={() => handleStepClick(step)}
                      disabled={loading}
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all",
                        "hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        step.completed
                          ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                          : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </button>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-8 mt-0.5 transition-all",
                          step.completed ? "bg-green-500" : "bg-muted-foreground/20"
                        )}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-0.5 min-w-0">
                    <button
                      onClick={() => handleStepClick(step)}
                      disabled={loading}
                      className={cn(
                        "w-full text-left hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors disabled:cursor-not-allowed",
                        getStatusColor(step.status),
                        "text-white"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs truncate">
                              {step.label}
                            </p>
                            <Edit2 className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {step.completed && step.timestamp && (
                            <p className="text-[10px] opacity-90 mt-0.5">
                              {format(new Date(step.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Last activity */}
            {lastActivity && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Última atividade
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium capitalize">{lastActivity.status}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(lastActivity.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground">
              Nenhum dado encontrado
            </p>
          </div>
        )}
      </DialogContent>

      {/* Modal de edição de status */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Alterar Status: {editingStep?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Status atual:</p>
              <Badge variant="outline" className="font-semibold">
                {ticketData?.status?.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Novo status:</p>
              <Badge variant="default" className="font-semibold">
                {editingStep?.label}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Motivo / Descrição da mudança
                <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o motivo da mudança de status..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Esta descrição será registrada no histórico do ticket
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStep(null)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Confirmar Mudança
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
