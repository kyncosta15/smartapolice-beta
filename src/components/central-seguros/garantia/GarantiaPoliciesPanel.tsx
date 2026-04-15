import { useState, useCallback } from 'react';
import { RefreshCw, Loader2, FileText, Search, Shield, CheckCircle2, XCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Policy {
  quoteId: number | null;
  documentNumber: number;
  policyNumber: string | null;
  policyholderFederalId: string | null;
  policyholderName: string | null;
  insuredFederalId: string | null;
  insuredName: string | null;
  modalityDescription: string | null;
  issueAt: string;
  durationStart: string;
  durationEnd: string;
  insuredAmount: number;
  totalPremium: number;
  commissionValue: number;
  cancellationAt: string | null;
  terminationDate: string | null;
  isPolicyRenewal: boolean;
  juntoPolicyNumber: string | null;
  economicGroup?: { name: string };
  detailsLink?: { href: string };
}

export function GarantiaPoliciesPanel() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [federalIdFilter, setFederalIdFilter] = useState('');
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        environment: 'sandbox',
        action: 'list',
        dateStart: `${dateStart}T00:00:00`,
        dateEnd: `${dateEnd}T23:59:59`,
        pageSize: 500,
      };
      if (federalIdFilter.trim()) body.federalId = federalIdFilter.trim();

      const { data, error } = await supabase.functions.invoke('junto-garantia-policies', { body });

      if (error) {
        toast.error('Erro ao buscar apólices');
        return;
      }

      if (data?.success) {
        setPolicies(data.policies || []);
        setHasSynced(true);
        toast.success(`${data.count || 0} apólice(s) encontrada(s)`);
      } else {
        toast.error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dateStart, dateEnd, federalIdFilter]);

  const getStatusBadge = (p: Policy) => {
    if (p.cancellationAt) {
      return <Badge variant="secondary"><XCircle className="mr-1 size-3" />Cancelada</Badge>;
    }
    if (p.terminationDate) {
      return <Badge className="bg-muted text-muted-foreground border-border"><AlertTriangle className="mr-1 size-3" />Baixada</Badge>;
    }
    return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 size-3" />Ativa</Badge>;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // KPIs
  const ativas = policies.filter(p => !p.cancellationAt && !p.terminationDate);
  const canceladas = policies.filter(p => !!p.cancellationAt);
  const totalIS = ativas.reduce((s, p) => s + (p.insuredAmount || 0), 0);
  const totalPremio = ativas.reduce((s, p) => s + (p.totalPremium || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CNPJ Tomador</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por CNPJ..."
                  value={federalIdFilter}
                  onChange={e => setFederalIdFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Início</label>
              <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Fim</label>
              <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <Button onClick={fetchPolicies} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              Sincronizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {hasSynced && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="size-4 text-emerald-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{ativas.length}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="size-4 text-destructive" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{canceladas.length}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Shield className="size-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalIS)}</p>
                <p className="text-xs text-muted-foreground">IS Total (Ativas)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="size-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalPremio)}</p>
                <p className="text-xs text-muted-foreground">Prêmio Total (Ativas)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Apólices Emitidas</CardTitle>
            {hasSynced && (
              <span className="text-xs text-muted-foreground">{policies.length} apólice(s)</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!hasSynced ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Nenhuma apólice carregada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Selecione o período e clique em "Sincronizar" para buscar apólices emitidas (máx. 30 dias).
              </p>
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <h3 className="font-semibold text-foreground mb-1">Nenhuma apólice encontrada</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar o período ou filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Apólice</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Tomador</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Modalidade</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Emissão</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Vigência</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">IS</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">Prêmio</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p, idx) => (
                    <tr key={p.documentNumber || idx} className="border-b border-border/50 hover:bg-primary/[0.02] transition-colors">
                      <td className="px-4 py-3">{getStatusBadge(p)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.policyNumber || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{p.policyholderName || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{p.modalityDescription || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(p.issueAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(p.durationStart)} — {formatDate(p.durationEnd)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(p.insuredAmount)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.totalPremium)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
