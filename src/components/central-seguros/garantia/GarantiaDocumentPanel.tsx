import { useState, useCallback } from 'react';
import { Loader2, Search, FileSearch, CheckCircle2, Clock, AlertTriangle, XCircle, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentStatus {
  id?: number;
  description?: string;
  completed?: boolean;
  date?: string;
}

const STATUS_MAP: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
  1: { label: 'Proposta recebida', icon: <Clock className="size-4" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  2: { label: 'Análise iniciada', icon: <FileSearch className="size-4" />, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  4: { label: 'Aprovação enviada por e-mail', icon: <Mail className="size-4" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  5: { label: 'Análise concluída: Apólice emitida', icon: <CheckCircle2 className="size-4" />, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  6: { label: 'Análise concluída: Proposta não aprovada', icon: <XCircle className="size-4" />, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function GarantiaDocumentPanel() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [statuses, setStatuses] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!documentNumber.trim()) {
      toast.error('Informe o número do documento');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-document', {
        body: { action: 'status', documentNumber: documentNumber.trim() },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao consultar status');
      const items = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
      setStatuses(items);
      if (items.length === 0) {
        toast.info('Nenhum status encontrado para este documento');
      }
    } catch (err: any) {
      toast.error(err.message);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [documentNumber]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileSearch className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Status de Internalização</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Acompanhe as etapas de internalização de uma proposta até sua finalização.
        </p>

        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nº do Documento</Label>
            <Input
              placeholder="Informe o número do documento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStatus()}
            />
          </div>
          <Button onClick={fetchStatus} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Search className="size-4 mr-1.5" />}
            Consultar
          </Button>
        </div>

        {searched && statuses.length > 0 && (
          <div className="space-y-1.5 pt-2">
            {statuses.map((status, idx) => {
              const mapped = STATUS_MAP[status.id || 0];
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    mapped?.color || 'bg-muted/50 text-muted-foreground border-border'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {mapped?.icon || <AlertTriangle className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {mapped?.label || status.description || `Status ${status.id}`}
                    </p>
                    {status.date && (
                      <p className="text-xs opacity-70">{status.date}</p>
                    )}
                  </div>
                  <Badge variant={status.completed ? 'default' : 'outline'} className="text-[10px]">
                    {status.completed ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {searched && !loading && statuses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum status encontrado para o documento informado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
