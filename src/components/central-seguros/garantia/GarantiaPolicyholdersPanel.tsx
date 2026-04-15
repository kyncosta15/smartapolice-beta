import { useState, useCallback } from 'react';
import { RefreshCw, Loader2, Users, Search, Building2, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Policyholder {
  id?: number;
  federalId: string;
  name: string;
  tradeName?: string;
  economicGroup?: { name: string };
  economicGroupName?: string;
  creditLimit?: number;
  creditLimitAvailable?: number;
  riskRating?: string;
  status?: string;
  registrationDate?: string;
  address?: { city?: string; state?: string };
  city?: string;
  state?: string;
  segment?: string;
  activityBranch?: string;
}

export function GarantiaPolicyholdersPanel() {
  const [policyholders, setPolicyholders] = useState<Policyholder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchPolicyholders = useCallback(async () => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        environment: 'sandbox',
        action: 'list',
        pageSize: 500,
      };
      if (searchFilter.trim()) {
        // If looks like a CNPJ (digits only), use federalId; otherwise use name
        const cleaned = searchFilter.replace(/\D/g, '');
        if (cleaned.length >= 11) {
          body.federalId = cleaned;
        } else {
          body.name = searchFilter.trim();
        }
      }

      const { data, error } = await supabase.functions.invoke('junto-garantia-policyholders', { body });

      if (error) {
        toast.error('Erro ao buscar tomadores');
        return;
      }

      if (data?.success) {
        setPolicyholders(data.policyholders || []);
        setHasSynced(true);
        toast.success(`${data.count || 0} tomador(es) encontrado(s)`);
      } else {
        toast.error(data?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [searchFilter]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatCnpj = (doc: string | null | undefined) => {
    if (!doc) return '—';
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return doc;
  };

  const getRatingBadge = (rating: string | null | undefined) => {
    if (!rating) return <Badge variant="outline" className="text-xs">—</Badge>;
    const colorMap: Record<string, string> = {
      A: 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
      B: 'bg-blue-500/15 text-blue-700 border-blue-200',
      C: 'bg-amber-500/15 text-amber-700 border-amber-200',
      D: 'bg-orange-500/15 text-orange-700 border-orange-200',
      E: 'bg-destructive/15 text-destructive border-destructive/30',
    };
    const letter = rating.charAt(0).toUpperCase();
    const cls = colorMap[letter] || 'bg-muted text-muted-foreground border-border';
    return <Badge className={`text-xs ${cls}`}>{rating}</Badge>;
  };

  // KPIs
  const totalLimit = policyholders.reduce((s, p) => s + (p.creditLimit || 0), 0);
  const totalAvailable = policyholders.reduce((s, p) => s + (p.creditLimitAvailable || 0), 0);
  const utilizationPct = totalLimit > 0 ? ((totalLimit - totalAvailable) / totalLimit * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Buscar Tomador</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou CNPJ do tomador..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={fetchPolicyholders} disabled={isLoading} size="sm">
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
              <div className="p-2 rounded-lg bg-primary/10"><Users className="size-4 text-primary" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{policyholders.length}</p>
                <p className="text-xs text-muted-foreground">Tomadores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Shield className="size-4 text-emerald-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalLimit)}</p>
                <p className="text-xs text-muted-foreground">Limite Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><TrendingUp className="size-4 text-blue-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(totalAvailable)}</p>
                <p className="text-xs text-muted-foreground">Limite Disponível</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><Building2 className="size-4 text-amber-600" /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{utilizationPct}%</p>
                <p className="text-xs text-muted-foreground">Utilização</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Tomadores Cadastrados</CardTitle>
            {hasSynced && (
              <span className="text-xs text-muted-foreground">{policyholders.length} tomador(es)</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!hasSynced ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Nenhum tomador carregado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Clique em "Sincronizar" para buscar tomadores cadastrados na Junto Seguros.
              </p>
            </div>
          ) : policyholders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <h3 className="font-semibold text-foreground mb-1">Nenhum tomador encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">CNPJ/CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Razão Social</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Grupo Econômico</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Rating</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">Limite</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-foreground/70">Disponível</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground/70">Cidade/UF</th>
                  </tr>
                </thead>
                <tbody>
                  {policyholders.map((p, idx) => {
                    const city = p.address?.city || p.city || '';
                    const state = p.address?.state || p.state || '';
                    const location = [city, state].filter(Boolean).join('/') || '—';
                    const group = p.economicGroup?.name || p.economicGroupName || '—';

                    return (
                      <tr key={p.federalId || idx} className="border-b border-border/50 hover:bg-primary/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{formatCnpj(p.federalId)}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-[200px]">
                            <p className="font-medium text-foreground truncate">{p.name || '—'}</p>
                            {p.tradeName && <p className="text-xs text-muted-foreground truncate">{p.tradeName}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{group}</td>
                        <td className="px-4 py-3">{getRatingBadge(p.riskRating)}</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{formatCurrency(p.creditLimit)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.creditLimitAvailable)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{location}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
