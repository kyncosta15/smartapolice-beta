import { useState, useCallback } from 'react';
import { Loader2, FileText, ExternalLink, AlertTriangle, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Billing {
  id: number;
  policyNumber: string;
  documentNumber: string;
  installmentNumber: number;
  dueDate: string;
  originalDueDate: string;
  amountToPay: number;
  dayOfDelay: number;
  paymentDate: string | null;
  amountPaid: number | null;
  cancellationDate: string | null;
  policyholder?: { federalId: string; name: string };
  economicGroup?: { name: string };
  modality?: { description: string };
  billUrl?: string;
}

interface BillingsPagination {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function GarantiaBillingsPanel() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [pagination, setPagination] = useState<BillingsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [policyFilter, setPolicyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBillings = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        environment: 'sandbox',
        action: 'list',
        pageNumber: page,
        rowsOfPage: 20,
      };
      if (statusFilter && statusFilter !== 'all') body.status = statusFilter;
      if (policyFilter.trim()) body.policyNumber = policyFilter.trim();

      const { data, error } = await supabase.functions.invoke('junto-garantia-billings', { body });

      if (error) {
        toast.error('Erro ao buscar títulos');
        return;
      }

      if (data?.success) {
        setBillings(data.billings || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
        setHasSynced(true);
        toast.success(`${data.billings?.length || 0} título(s) encontrado(s)`);
      } else {
        toast.error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, policyFilter]);

  const getStatusBadge = (billing: Billing) => {
    if (billing.paymentDate) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 size-3" />Pago</Badge>;
    if (billing.cancellationDate) return <Badge variant="secondary"><XCircle className="mr-1 size-3" />Cancelado</Badge>;
    if (billing.dayOfDelay > 0) return <Badge className="bg-destructive/15 text-destructive border-destructive/20"><AlertTriangle className="mr-1 size-3" />Vencido ({billing.dayOfDelay}d)</Badge>;
    return <Badge className="bg-primary/10 text-primary border-primary/20"><Clock className="mr-1 size-3" />Em aberto</Badge>;
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

  const totalAberto = billings.filter(b => !b.paymentDate && !b.cancellationDate && b.dayOfDelay <= 0).reduce((s, b) => s + (b.amountToPay || 0), 0);
  const totalVencido = billings.filter(b => !b.paymentDate && !b.cancellationDate && b.dayOfDelay > 0).reduce((s, b) => s + (b.amountToPay || 0), 0);
  const totalPago = billings.filter(b => !!b.paymentDate).reduce((s, b) => s + (b.amountPaid || b.amountToPay || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters + KPIs */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nº Apólice</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Buscar por apólice..." value={policyFilter} onChange={e => setPolicyFilter(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Opened">Em aberto</SelectItem>
                  <SelectItem value="Overdue">Vencido</SelectItem>
                  <SelectItem value="Paid">Pago</SelectItem>
                  <SelectItem value="Cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchBillings(1)} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Search className="mr-1.5 size-4" />}
              Buscar
            </Button>
          </div>

          {hasSynced && (
            <div className="grid gap-3 grid-cols-3 pt-2 border-t border-border">
              <div className="flex items-center gap-3 p-2">
                <div className="p-1.5 rounded-md bg-primary/10"><Clock className="size-4 text-primary" /></div>
                <div><p className="text-sm font-bold text-foreground">{formatCurrency(totalAberto)}</p><p className="text-[10px] text-muted-foreground">Em Aberto</p></div>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="p-1.5 rounded-md bg-destructive/10"><AlertTriangle className="size-4 text-destructive" /></div>
                <div><p className="text-sm font-bold text-foreground">{formatCurrency(totalVencido)}</p><p className="text-[10px] text-muted-foreground">Vencido</p></div>
              </div>
              <div className="flex items-center gap-3 p-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10"><CheckCircle2 className="size-4 text-emerald-600" /></div>
                <div><p className="text-sm font-bold text-foreground">{formatCurrency(totalPago)}</p><p className="text-[10px] text-muted-foreground">Pago</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {!hasSynced ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4"><FileText className="size-8 text-muted-foreground" /></div>
              <h3 className="font-semibold text-foreground mb-1">Nenhum título carregado</h3>
              <p className="text-sm text-muted-foreground max-w-md">Clique em "Buscar" para buscar os títulos da API Junto Seguros.</p>
            </div>
          ) : billings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <h3 className="font-semibold text-foreground mb-1">Nenhum título encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Apólice</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Tomador</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Parcela</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Vencimento</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-foreground/70">Boleto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((b) => (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-primary/[0.02] transition-colors">
                        <td className="px-4 py-3">{getStatusBadge(b)}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{b.policyNumber || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{b.policyholder?.name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.installmentNumber || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(b.dueDate)}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(b.amountToPay)}</td>
                        <td className="px-4 py-3 text-center">
                          {b.billUrl ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={b.billUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /></a>
                            </Button>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && (pagination.hasNext || pagination.hasPrevious) && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                  <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={() => fetchBillings(currentPage - 1)}>Anterior</Button>
                  <span className="text-sm text-muted-foreground">{pagination.pageNumber} / {pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={() => fetchBillings(currentPage + 1)}>Próximo</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
