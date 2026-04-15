import { useState, useCallback } from 'react';
import { Loader2, Building, Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Grupos Econômicos</h3>
          </div>

          <div className="flex gap-2 items-end">
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
            <Button onClick={fetchGroups} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Search className="size-4 mr-1.5" />}
              Buscar
            </Button>
          </div>

          {!hasSearched && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building className="size-8 mx-auto mb-2 opacity-40" />
              <p>Clique em "Buscar" para consultar grupos econômicos.</p>
            </div>
          )}

          {hasSearched && groups.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Nenhum grupo econômico encontrado.</p>
            </div>
          )}

          {groups.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">{groups.length} resultado(s)</p>
              <div className="space-y-1.5">
                {groups.map((group, idx) => (
                  <div key={group.id || idx} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Users className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{group.name || 'Sem nome'}</p>
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
                      <div className="mt-2 pl-10 space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground">Tomadores:</p>
                        {group.policyholders.map((ph, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            • {ph.name} {ph.federalId ? `(${ph.federalId})` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
