import { useState, useCallback } from 'react';
import { Search, Loader2, RefreshCw, UserCheck, Building2, FileText, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InsuredItem {
  federalId?: string;
  name?: string;
  tradeName?: string;
  companyName?: string;
  status?: string;
  city?: string;
  state?: string;
  [key: string]: unknown;
}

export function GarantiaInsuredPanel() {
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [insuredList, setInsuredList] = useState<InsuredItem[]>([]);
  const [searchFederalId, setSearchFederalId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [registerFederalId, setRegisterFederalId] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [selectedInsured, setSelectedInsured] = useState<InsuredItem | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchInsured = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-insured', {
        body: {
          action: 'list',
          environment: 'sandbox',
          federalId: searchFederalId || undefined,
          name: searchName || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setInsuredList(data.insured || []);
        toast.success(`${data.count || 0} segurado(s) encontrado(s)`);
      } else {
        toast.error(data?.error || 'Erro ao buscar segurados');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [searchFederalId, searchName]);

  const fetchDetails = useCallback(async (federalId: string) => {
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-insured', {
        body: { action: 'details', environment: 'sandbox', federalId },
      });
      if (error) throw error;
      if (data?.success) {
        setSelectedInsured(data.insured);
      } else {
        toast.error(data?.error || 'Erro ao buscar detalhes');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async () => {
    if (!registerFederalId.trim()) {
      toast.error('Informe o CNPJ/CPF do segurado');
      return;
    }
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-insured', {
        body: {
          action: 'register',
          environment: 'sandbox',
          federalId: registerFederalId.replace(/\D/g, ''),
          name: registerName || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message || 'Segurado cadastrado com sucesso');
        setRegisterFederalId('');
        setRegisterName('');
      } else {
        toast.error(data?.error || 'Erro ao cadastrar');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setRegistering(false);
    }
  }, [registerFederalId, registerName]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4" /> Buscar Segurados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="CNPJ/CPF do segurado"
              value={searchFederalId}
              onChange={(e) => setSearchFederalId(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="Nome / Razão Social"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={fetchInsured} disabled={loading} size="sm">
              {loading ? <Loader2 className="size-4 animate-spin mr-1" /> : <RefreshCw className="size-4 mr-1" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Register */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="size-4" /> Cadastrar Segurado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">CNPJ/CPF *</label>
              <Input
                placeholder="00.000.000/0000-00"
                value={registerFederalId}
                onChange={(e) => setRegisterFederalId(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nome (opcional)</label>
              <Input
                placeholder="Razão social"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button onClick={handleRegister} disabled={registering} size="sm">
              {registering ? <Loader2 className="size-4 animate-spin mr-1" /> : <UserCheck className="size-4 mr-1" />}
              Cadastrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {insuredList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4" /> Segurados ({insuredList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insuredList.map((item, idx) => {
                const name = item.name || item.companyName || item.tradeName || 'Sem nome';
                const doc = item.federalId || '—';
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg border border-border bg-background">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{doc}</p>
                        {(item.city || item.state) && (
                          <p className="text-xs text-muted-foreground">{[item.city, item.state].filter(Boolean).join(' / ')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status && (
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={detailsLoading}
                        onClick={() => fetchDetails(doc)}
                      >
                        <FileText className="size-3 mr-1" /> Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      {selectedInsured && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="size-4" /> Detalhes do Segurado
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedInsured(null)}>Fechar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-80 border border-border">
              {JSON.stringify(selectedInsured, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
