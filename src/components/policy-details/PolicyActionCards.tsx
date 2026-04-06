import { AlertTriangle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  type: 'overdue' | 'upcoming';
  apolice_parcela_id?: string;
  policy_id: string;
}

interface PolicyActionCardsProps {
  actions: ActionItem[];
  onStatusChange: () => void;
}

export function PolicyActionCards({ actions, onStatusChange }: PolicyActionCardsProps) {
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);

  if (actions.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-200">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Tudo sob controle</p>
          <p className="text-xs text-muted-foreground">Nenhuma ação pendente no momento.</p>
        </div>
      </div>
    );
  }

  const formatDateBR = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  const handleMarkAsPaid = async (action: ActionItem) => {
    setSavingId(action.id);
    try {
      if (action.apolice_parcela_id) {
        const { error } = await supabase
          .from('apolice_parcelas')
          .update({ status_pagamento: 'Pago' })
          .eq('id', action.apolice_parcela_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('apolice_parcelas')
          .upsert({
            apolice_id: action.policy_id,
            numero_parcela: action.numero,
            valor: action.valor,
            vencimento: action.vencimento || new Date().toISOString().split('T')[0],
            status_pagamento: 'Pago',
          }, { onConflict: 'apolice_id,numero_parcela' });
        if (error) throw error;
      }
      toast({ title: '✅ Parcela marcada como paga' });
      onStatusChange();
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        Ações recomendadas
      </h3>
      <div className="space-y-2">
        {actions.slice(0, 5).map((action) => (
          <div
            key={action.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
              action.type === 'overdue'
                ? 'bg-destructive/5 border-destructive/20'
                : 'bg-amber-500/5 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-1.5 rounded-lg ${
                action.type === 'overdue' ? 'bg-destructive/10' : 'bg-amber-500/10'
              }`}>
                {action.type === 'overdue' 
                  ? <AlertTriangle className="h-4 w-4 text-destructive" />
                  : <Clock className="h-4 w-4 text-amber-600" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Parcela {action.numero} — {formatCurrency(action.valor)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.type === 'overdue' ? 'Vencida em' : 'Vence em'} {formatDateBR(action.vencimento)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMarkAsPaid(action)}
              disabled={savingId === action.id}
              className="shrink-0 text-xs h-8 border-border hover:bg-muted"
            >
              {savingId === action.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Marcar pago'
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
