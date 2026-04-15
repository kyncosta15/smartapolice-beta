import { useState, useCallback } from 'react';
import { RefreshCw, Loader2, Building, Search, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EconomicGroup {
  id?: number;
  name?: string;
  federalId?: string;
  policyholders?: Array<{ name?: string; federalId?: string }>;
  totalPolicyholders?: number;
}

export function GarantiaEconomicGroupPanel() {
  const [groups, setGroups] = useState<EconomicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-economic-group', {
        body: {
          action: 'list',
          environment: 'sandbox',
          name: searchName || undefined,
          page: 1,
          pageSize: 50,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const items = Array.isArray(data.data) ? data.data : data.data?.items || data.data?.content || [];
        setGroups(items);
        setHasSearched(true);
        toast.success(`${items.length} grupo(s) econômico(s) encontrado(s)`);
      } else {
        toast.error(data?.error || 'Erro ao buscar grupos econômicos');
      }
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchName]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="size-4" />
            Grupos Econômicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do grupo..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && fetchGroups()}
              />
            </div>
            <Button onClick={fetchGroups} disabled={loading} size="sm">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              <span className="ml-1">Buscar</span>
            </Button>
          </div>

          {!hasSearched && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building className="size-8 mx-auto mb-2 opacity-40" />
              <p>Clique em "Buscar" para consultar grupos econômicos na API Junto Seguros.</p>
            </div>
          )}

          {hasSearched && groups.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Nenhum grupo econômico encontrado.</p>
            </div>
          )}

          {groups.length > 0 && (
            <div className="space-y-2">
              {groups.map((group, idx) => (
                <Card key={group.id || idx} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border border-border bg-background">
                          <Users className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{group.name || 'Sem nome'}</p>
                          {group.federalId && (
                            <p className="text-xs text-muted-foreground">CNPJ: {group.federalId}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.totalPolicyholders != null && (
                          <Badge variant="outline" className="text-xs">
                            {group.totalPolicyholders} tomador(es)
                          </Badge>
                        )}
                        {group.id && (
                          <Badge variant="secondary" className="text-xs">
                            ID: {group.id}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {group.policyholders && group.policyholders.length > 0 && (
                      <div className="mt-3 pl-12 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Tomadores:</p>
                        {group.policyholders.map((ph, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            • {ph.name} {ph.federalId ? `(${ph.federalId})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
