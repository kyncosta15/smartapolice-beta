import { useState, useCallback } from 'react';
import { RefreshCw, Loader2, FileText, Search, ArrowUpDown, ArrowDown, ArrowUp, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Endorsement {
  documentNumber: number;
  mainDocumentNumber: number;
  mainPolicyNumber: string | null;
  policyholderName: string | null;
  policyholderFederalId: string | null;
  insuredName: string | null;
  modalityDescription: string | null;
  subModalityDescription: string | null;
  documentType?: { id: number; description: string };
  createdAt: string;
  durationStart: string;
  durationEnd: string;
  durationInDays: number;
  premiumValue: number;
  endorsementSecuredAmount: number;
  brokerName: string | null;
}

interface EndorsementsPagination {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: '2', label: 'Aumento IS' },
  { value: '3', label: 'Aumento Prazo' },
  { value: '4', label: 'Aumento Prazo e IS' },
  { value: '5', label: 'Redução IS' },
  { value: '6', label: 'Neutro' },
  { value: '7', label: 'Cancelamento' },
  { value: '8', label: 'Baixa' },
  { value: '10', label: 'Redução Prazo' },
  { value: '11', label: 'Redução Prazo e IS' },
];

const getTypeIcon = (typeId?: number) => {
  if (!typeId) return <ArrowUpDown className="mr-1 size-3" />;
  if ([2, 3, 4].includes(typeId)) return <ArrowUp className="mr-1 size-3" />;
  if ([5, 10, 11].includes(typeId)) return <ArrowDown className="mr-1 size-3" />;
  if (typeId === 7) return <XCircle className="mr-1 size-3" />;
  return <ArrowUpDown className="mr-1 size-3" />;
};

const getTypeBadgeClass = (typeId?: number) => {
  if (!typeId) return 'bg-muted text-muted-foreground border-border';
  if ([2, 3, 4].includes(typeId)) return 'bg-emerald-500/15 text-emerald-700 border-emerald-200';
  if ([5, 10, 11].includes(typeId)) return 'bg-amber-500/15 text-amber-700 border-amber-200';
  if (typeId === 7) return 'bg-destructive/15 text-destructive border-destructive/20';
  if (typeId === 8) return 'bg-muted text-muted-foreground border-border';
  return 'bg-primary/10 text-primary border-primary/20';
};

export function GarantiaEndorsementsPanel() {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [pagination, setPagination] = useState<EndorsementsPagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchEndorsements = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        environment: 'sandbox',
        action: 'list',
        startDate: `${dateStart}T00:00:00`,
        endDate: `${dateEnd}T23:59:59`,
        pageNumber: page,
        rowsOfPage: 20,
      };
      if (documentTypeFilter && documentTypeFilter !== 'all') {
        body.documentType = Number(documentTypeFilter);
      }

      const { data, error } = await supabase.functions.invoke('junto-garantia-endorsements', { body });

      if (error) {
        toast.error('Erro ao buscar endossos');
        return;
      }

      if (data?.success) {
        setEndorsements(data.endorsements || []);
        setPagination(data.pagination || null);
        setCurrentPage(page);
        setHasSynced(true);
        const count = data.endorsements?.length || 0;
        toast.success(`${count} endosso(s) encontrado(s)`);
      } else {
        toast.error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dateStart, dateEnd, documentTypeFilter]);

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
  const totalPremio = endorsements.reduce((s, e) => s + (e.premiumValue || 0), 0);
  const totalIS = endorsements.reduce((s, e) => s + (e.endorsementSecuredAmount || 0), 0);
  const aumentos = endorsements.filter(e => [2, 3, 4].includes(e.documentType?.id || 0)).length;
  const reducoes = endorsements.filter(e => [5, 7, 8, 10, 11].includes(e.documentType?.id || 0)).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Início</label>
              <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} />
            </div>
            <div className="w-full sm:w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Fim</label>
              <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
            </div>
            <div className="w-full sm:w-52">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Endosso</label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchEndorsements(1)} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {hasSynced && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><ArrowUp className="size-4 text-emerald-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{aumentos}</p>
                <p className="text-xs text-muted-foreground">Aumentos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><ArrowDown className="size-4 text-amber-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{reducoes}</p>
                <p className="text-xs text-muted-foreground">Reduções / Cancel.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Calendar className="size-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalPremio)}</p>
                <p className="text-xs text-muted-foreground">Prêmio Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><ArrowUpDown className="size-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalIS)}</p>
                <p className="text-xs text-muted-foreground">IS Endossada</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Endossos Emitidos</CardTitle>
            {pagination && (
              <span className="text-xs text-muted-foreground">
                {pagination.totalCount} endosso(s) • Página {pagination.pageNumber}/{pagination.totalPages}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!hasSynced ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <FileText className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Nenhum endosso carregado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Selecione o período e clique em "Buscar" para buscar endossos emitidos (máx. 90 dias).
              </p>
            </div>
          ) : endorsements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <h3 className="font-semibold text-foreground mb-1">Nenhum endosso encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar o período ou filtros.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Apólice</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Tomador</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Modalidade</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Vigência</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">IS Endossada</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">Prêmio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endorsements.map((e, idx) => (
                      <tr key={e.documentNumber || idx} className="border-b border-border/50 hover:bg-primary/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <Badge className={getTypeBadgeClass(e.documentType?.id)}>
                            {getTypeIcon(e.documentType?.id)}
                            {e.documentType?.description || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{e.mainPolicyNumber || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{e.policyholderName || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{e.modalityDescription || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(e.durationStart)} — {formatDate(e.durationEnd)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(e.endorsementSecuredAmount)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(e.premiumValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (pagination.hasNext || pagination.hasPrevious) && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                  <Button variant="outline" size="sm" disabled={!pagination.hasPrevious || isLoading} onClick={() => fetchEndorsements(currentPage - 1)}>
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.pageNumber} / {pagination.totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext || isLoading} onClick={() => fetchEndorsements(currentPage + 1)}>
                    Próximo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
