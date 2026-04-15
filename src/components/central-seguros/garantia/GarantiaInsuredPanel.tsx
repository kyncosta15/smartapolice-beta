import { useState, useCallback } from 'react';
import { Search, Loader2, UserCheck, Building2, FileText, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [registerStreet, setRegisterStreet] = useState('');
  const [registerCity, setRegisterCity] = useState('');
  const [registerState, setRegisterState] = useState('');
  const [registerZipCode, setRegisterZipCode] = useState('');
  const [registerInsuredType, setRegisterInsuredType] = useState('9');
  const [selectedInsured, setSelectedInsured] = useState<InsuredItem | null>(null);
  const [activeTab, setActiveTab] = useState('search');

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

  const showDetails = useCallback((federalId: string) => {
    const found = insuredList.find(item => {
      const doc = (item.federalId || '').replace(/\D/g, '');
      return doc === federalId.replace(/\D/g, '');
    });
    if (found) {
      setSelectedInsured(found);
    } else {
      toast.error('Segurado não encontrado nos resultados');
    }
  }, [insuredList]);

  const handleRegister = useCallback(async () => {
    if (!registerFederalId.trim()) {
      toast.error('Informe o CNPJ/CPF do segurado');
      return;
    }
    if (!registerStreet.trim() || !registerCity.trim() || !registerState.trim() || !registerZipCode.trim()) {
      toast.error('Preencha todos os campos de endereço (Rua, Cidade, UF, CEP)');
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
          insuredType: parseInt(registerInsuredType, 10),
          address: {
            street: registerStreet,
            city: registerCity,
            state: registerState,
            zipCode: registerZipCode.replace(/\D/g, ''),
          },
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message || 'Segurado cadastrado com sucesso');
        setRegisterFederalId('');
        setRegisterName('');
        setRegisterStreet('');
        setRegisterCity('');
        setRegisterState('');
        setRegisterZipCode('');
        setRegisterInsuredType('9');
        setActiveTab('search');
      } else {
        const errorDetail = data?.details ? `\n${data.details}` : '';
        toast.error(`${data?.error || 'Erro ao cadastrar'}${errorDetail}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado');
    } finally {
      setRegistering(false);
    }
  }, [registerFederalId, registerName, registerStreet, registerCity, registerState, registerZipCode, registerInsuredType]);

  // Details panel (overlay style)
  if (selectedInsured) {
    const insured = Array.isArray(selectedInsured) ? selectedInsured[0] : selectedInsured;
    const addr = (insured as any)?.address?.[0] || {};
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between p-4 pb-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCheck className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{insured?.name || 'Segurado'}</h3>
                <p className="text-xs text-muted-foreground">{insured?.federalId || '—'}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedInsured(null)}>
              <X className="size-4" />
            </Button>
          </div>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DetailField label="Tipo">
                <Badge variant="outline" className="text-xs">
                  {insured?.typeDescription || (insured?.type === 8 ? 'Pública' : insured?.type === 9 ? 'Privada' : `Tipo ${insured?.type}`)}
                </Badge>
              </DetailField>
              <DetailField label="ID Interno" value={insured?.id || '—'} />
              <DetailField label="Pendente">
                <Badge variant={insured?.pending ? 'destructive' : 'secondary'} className="text-xs">
                  {insured?.pending ? 'Sim' : 'Não'}
                </Badge>
              </DetailField>
              {insured?.additionalName && (
                <DetailField label="Nome Adicional" value={insured.additionalName as string} />
              )}
            </div>

            {(addr.street || addr.city || addr.state) && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Endereço</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {addr.street && <DetailField label="Logradouro" value={addr.street} className="col-span-2" />}
                  {addr.city && <DetailField label="Cidade" value={addr.city} />}
                  {addr.state && <DetailField label="UF" value={addr.state} />}
                  {addr.zipCode && <DetailField label="CEP" value={addr.zipCode} />}
                  {addr.email && <DetailField label="E-mail" value={addr.email} />}
                  {addr.phone && <DetailField label="Telefone" value={addr.phone} />}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 pt-4">
            <TabsList className="w-full max-w-xs">
              <TabsTrigger value="search" className="flex-1 gap-1.5">
                <Search className="size-3.5" /> Buscar
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 gap-1.5">
                <Plus className="size-3.5" /> Cadastrar
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="pt-4">
            <TabsContent value="search" className="mt-0 space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground mb-1 block">CNPJ/CPF</label>
                  <Input
                    placeholder="Digite o documento"
                    value={searchFederalId}
                    onChange={(e) => setSearchFederalId(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground mb-1 block">Nome / Razão Social</label>
                  <Input
                    placeholder="Digite o nome"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>
                <Button onClick={fetchInsured} disabled={loading} className="shrink-0">
                  {loading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Search className="size-4 mr-1.5" />}
                  Buscar
                </Button>
              </div>

              {/* Results inline */}
              {insuredList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {insuredList.length} resultado(s)
                  </p>
                  <div className="space-y-1.5">
                    {insuredList.map((item, idx) => {
                      const name = item.name || item.companyName || item.tradeName || 'Sem nome';
                      const doc = item.federalId || '—';
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => showDetails(doc)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <Building2 className="size-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc}
                                {(item.city || item.state) && ` · ${[item.city, item.state].filter(Boolean).join('/')}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.status && (
                              <Badge variant="outline" className="text-xs">{item.status}</Badge>
                            )}
                            <FileText className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="register" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CNPJ/CPF *</label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={registerFederalId}
                    onChange={(e) => setRegisterFederalId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome (opcional)</label>
                  <Input
                    placeholder="Razão social"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo *</label>
                  <Select value={registerInsuredType} onValueChange={setRegisterInsuredType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">Empresa Privada</SelectItem>
                      <SelectItem value="8">Empresa Pública</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Endereço</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Rua/Logradouro *</label>
                    <Input
                      placeholder="Rua, Av, etc."
                      value={registerStreet}
                      onChange={(e) => setRegisterStreet(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Cidade *</label>
                    <Input
                      placeholder="São Paulo"
                      value={registerCity}
                      onChange={(e) => setRegisterCity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">UF *</label>
                      <Input
                        placeholder="SP"
                        value={registerState}
                        onChange={(e) => setRegisterState(e.target.value)}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">CEP *</label>
                      <Input
                        placeholder="00000-000"
                        value={registerZipCode}
                        onChange={(e) => setRegisterZipCode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleRegister} disabled={registering}>
                  {registering ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <UserCheck className="size-4 mr-1.5" />}
                  Cadastrar Segurado
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function DetailField({ label, value, children, className }: { label: string; value?: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {children || <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>}
    </div>
  );
}
