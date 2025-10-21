import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { status: 'em_analise', label: 'Em Análise', order: 2 },
  { status: 'aguardando_seguradora', label: 'Aguardando Seguradora', order: 3 },
  { status: 'em_reparo', label: 'Em Reparo', order: 4 },
  { status: 'finalizado', label: 'Finalizado', order: 5 },
];

// Etapas para assistências
const ASSISTENCIA_STEPS = [
  { status: 'aberto', label: 'Abertura', order: 1 },
  { status: 'em_analise', label: 'Atendimento em Andamento', order: 2 },
  { status: 'aguardando_seguradora', label: 'Saída de Base', order: 3 },
  { status: 'em_reparo', label: 'Aguardando Prestador', order: 4 },
  { status: 'finalizado', label: 'Finalizado', order: 5 },
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
    
    // Encontrar a ordem do status atual
    const currentStepOrder = stepsTemplate.find(s => s.status === currentStatus)?.order || 1;

    // Mapear movimentos de status para timestamps
    const statusTimestamps: Record<string, string> = {};
    movementsData.forEach(movement => {
      if (movement.tipo === 'status_change' && movement.payload?.status_novo) {
        statusTimestamps[movement.payload.status_novo] = movement.created_at;
      }
    });

    // Criar steps processados
    const processedSteps: StatusStep[] = stepsTemplate.map(step => ({
      ...step,
      completed: step.order <= currentStepOrder,
      timestamp: statusTimestamps[step.status] || (step.order === 1 ? ticket.created_at : undefined),
    }));

    setSteps(processedSteps);
  };

  const getProgressPercentage = () => {
    if (!steps.length) return 0;
    const completedCount = steps.filter(s => s.completed).length;
    return Math.round((completedCount / steps.length) * 100);
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
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div key={step.status} className="flex items-start gap-3 py-3">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                        step.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-background border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-xs font-semibold">{step.order}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-12 mt-1 transition-all",
                          step.completed ? "bg-green-500" : "bg-muted-foreground/20"
                        )}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={cn(
                            "font-semibold text-sm",
                            step.completed ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </p>
                        {step.completed && step.timestamp && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Concluída
                          </p>
                        )}
                      </div>
                      {step.completed && step.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(step.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
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
    </Dialog>
  );
}
