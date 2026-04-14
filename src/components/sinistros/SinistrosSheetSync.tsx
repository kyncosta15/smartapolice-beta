import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface SheetConfig {
  id: string;
  sheet_url: string;
  sheet_name: string;
  empresa_id: string;
  last_synced_at: string | null;
  sync_count: number;
  status: string;
  created_at: string;
}

interface SyncResult {
  success: boolean;
  registros_encontrados: number;
  registros_novos: number;
  registros_existentes: number;
  erros: number;
  detalhes: Array<{
    nome?: string;
    numero_sinistro?: string;
    status?: string;
    error?: string;
  }>;
}

interface Empresa {
  id: string;
  nome: string;
}

export function SinistrosSheetSync() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  
  // New config form
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmpresaId, setNewEmpresaId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load empresas from memberships
      const { data: memberships } = await supabase
        .from('user_memberships')
        .select('empresa_id')
        .eq('user_id', user.id);

      const empresaIds = memberships?.map(m => m.empresa_id) || [];
      
      if (empresaIds.length > 0) {
        const { data: empresasData } = await supabase
          .from('empresas')
          .select('id, nome')
          .in('id', empresaIds);
        setEmpresas(empresasData || []);
      }

      // Load configs  
      const { data: configsData } = await supabase
        .from('sinistro_sheet_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      setConfigs((configsData as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfig = async () => {
    if (!newUrl || !newEmpresaId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    
    // Validate Google Sheets URL
    if (!newUrl.includes('docs.google.com/spreadsheets')) {
      toast({ title: 'URL inválida', description: 'Insira um link válido do Google Sheets', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('sinistro_sheet_configs').insert({
        sheet_url: newUrl,
        sheet_name: newName || 'Planilha de Sinistros',
        empresa_id: newEmpresaId,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: 'Planilha vinculada com sucesso!' });
      setNewUrl('');
      setNewName('');
      setNewEmpresaId('');
      setShowForm(false);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao vincular', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (config: SheetConfig) => {
    setSyncing(config.id);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-sinistros-sheet', {
        body: {
          config_id: config.id,
          sheet_url: config.sheet_url,
          empresa_id: config.empresa_id,
        },
      });

      if (error) throw error;

      setSyncResult(data);
      loadData();

      if (data.registros_novos > 0) {
        toast({
          title: 'Sincronização concluída!',
          description: `${data.registros_novos} novo(s) sinistro(s) importado(s)`,
        });
      } else {
        toast({
          title: 'Sincronização concluída',
          description: 'Nenhum sinistro novo encontrado',
        });
      }
    } catch (error: any) {
      toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' });
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('sinistro_sheet_configs').delete().eq('id', id);
      toast({ title: 'Planilha removida' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };

  const getEmpresaNome = (empresaId: string) => {
    return empresas.find(e => e.id === empresaId)?.nome || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Importar Planilha Google Sheets
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vincule planilhas do Google Sheets para importar sinistros automaticamente
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancelar' : 'Vincular Planilha'}
        </Button>
      </div>

      {/* New config form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Vincular Nova Planilha</CardTitle>
            <CardDescription>
              A planilha deve estar com acesso público (qualquer pessoa com o link pode visualizar)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Google Sheets *</Label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Planilha</Label>
                <Input
                  placeholder="Ex: Controle de Sinistros - Limp City"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conta / Empresa Vinculada *</Label>
                <Select value={newEmpresaId} onValueChange={setNewEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddConfig} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Vincular Planilha
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing configs */}
      {configs.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma planilha vinculada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Vincule uma planilha do Google Sheets para importar sinistros automaticamente.
              O sistema identifica duplicatas pelo número do sinistro.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Vincular Primeira Planilha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <Card key={config.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">{config.sheet_name}</h3>
                      <Badge variant={config.status === 'ativo' ? 'default' : 'secondary'} className="shrink-0">
                        {config.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{config.sheet_url}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Empresa: <strong>{getEmpresaNome(config.empresa_id)}</strong></span>
                      {config.last_synced_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última sync: {new Date(config.last_synced_at).toLocaleString('pt-BR')}
                        </span>
                      )}
                      {config.sync_count > 0 && (
                        <span>{config.sync_count} registros</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={config.sheet_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSync(config)}
                      disabled={syncing === config.id}
                    >
                      {syncing === config.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sincronizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {syncResult.erros === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Resultado da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{syncResult.registros_encontrados}</p>
                <p className="text-xs text-muted-foreground">Encontrados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{syncResult.registros_novos}</p>
                <p className="text-xs text-muted-foreground">Novos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{syncResult.registros_existentes}</p>
                <p className="text-xs text-muted-foreground">Já existentes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-600">{syncResult.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {syncResult.detalhes && syncResult.detalhes.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {syncResult.detalhes.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1">
                      {d.status === 'importado' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                      ) : d.status?.startsWith('existente') ? (
                        <Clock className="h-3 w-3 text-blue-600 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600 shrink-0" />
                      )}
                      <span className="text-foreground">{d.nome || 'Desconhecido'}</span>
                      {d.numero_sinistro && (
                        <Badge variant="outline" className="text-[10px]">{d.numero_sinistro}</Badge>
                      )}
                      <span className="text-muted-foreground ml-auto">
                        {d.status === 'importado' ? 'Importado' : 
                         d.status?.startsWith('existente') ? 'Já existia' :
                         d.error || 'Erro'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
