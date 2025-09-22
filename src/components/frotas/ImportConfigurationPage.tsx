import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Upload, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  RotateCcw,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ImportSettings {
  auto_fill_enabled: boolean;
  update_policy: 'empty_only' | 'whitelist' | 'block_conflicts';
  allowed_fields: string[];
  category_mapping: Record<string, string>;
}

interface AuditRecord {
  id: string;
  field_name: string;
  previous_value: string;
  new_value: string;
  source: string;
  import_job_id: string;
  applied_at: string;
  reverted_at?: string;
  veiculo_placa: string;
}

interface ImportJob {
  id: string;
  job_id: string;
  status: string;
  summary: any;
  processed_at: string;
  created_at: string;
}

const AVAILABLE_FIELDS = [
  { key: 'codigo_interno', label: 'Código Interno' },
  { key: 'placa', label: 'Placa' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'chassi', label: 'Chassi' },
  { key: 'renavam', label: 'Renavam' },
  { key: 'marca', label: 'Marca' },
  { key: 'ano_modelo', label: 'Ano' },
  { key: 'proprietario_nome', label: 'Proprietário' },
  { key: 'localizacao', label: 'Localização' },
  { key: 'familia', label: 'Família' },
  { key: 'status_veiculo', label: 'Status do Veículo' },
  { key: 'origem_planilha', label: 'Origem da Planilha' }
];

export function ImportConfigurationPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<ImportSettings>({
    auto_fill_enabled: true,
    update_policy: 'empty_only',
    allowed_fields: [],
    category_mapping: {}
  });
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [newMapping, setNewMapping] = useState({ from: '', to: '' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.company) return;

    try {
      setLoading(true);
      
      // Buscar empresa_id
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) {
        toast({
          title: "Erro",
          description: "Empresa não encontrada",
          variant: "destructive"
        });
        return;
      }

      // Carregar configurações
      const { data: settingsData } = await supabase
        .from('company_import_settings')
        .select('*')
        .eq('empresa_id', empresa.id)
        .single();

      if (settingsData) {
        setSettings({
          auto_fill_enabled: settingsData.auto_fill_enabled,
          update_policy: settingsData.update_policy as 'empty_only' | 'whitelist' | 'block_conflicts',
          allowed_fields: (settingsData.allowed_fields as string[]) || [],
          category_mapping: (settingsData.category_mapping as Record<string, string>) || {}
        });
      }

      // Carregar auditoria
      const { data: auditData } = await supabase
        .from('veiculo_field_sources')
        .select(`
          *,
          frota_veiculos!inner(placa)
        `)
        .order('applied_at', { ascending: false })
        .limit(100);

      if (auditData) {
        setAuditRecords(auditData.map(record => ({
          ...record,
          veiculo_placa: record.frota_veiculos.placa
        })));
      }

      // Carregar jobs de importação
      const { data: jobsData } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (jobsData) {
        setImportJobs(jobsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.company) return;

    try {
      setSaving(true);

      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) return;

      const { error } = await supabase
        .from('company_import_settings')
        .upsert({
          empresa_id: empresa.id,
          auto_fill_enabled: settings.auto_fill_enabled,
          update_policy: settings.update_policy,
          allowed_fields: settings.allowed_fields,
          category_mapping: settings.category_mapping
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso"
      });

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const executeNow = async () => {
    try {
      setExecuting(true);

      const response = await supabase.functions.invoke('auto-fill-worker');
      
      if (response.error) throw response.error;

      toast({
        title: "Sucesso",
        description: `Processamento executado: ${response.data.processed} jobs processados`
      });

      loadData(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao executar:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar processamento",
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  const revertField = async (recordId: string) => {
    try {
      const record = auditRecords.find(r => r.id === recordId);
      if (!record) return;

      // Buscar o veículo
      const { data: veiculo } = await supabase
        .from('frota_veiculos')
        .select('id')
        .eq('placa', record.veiculo_placa)
        .single();

      if (!veiculo) return;

      // Reverter o campo
      const { error: updateError } = await supabase
        .from('frota_veiculos')
        .update({ [record.field_name]: record.previous_value })
        .eq('id', veiculo.id);

      if (updateError) throw updateError;

      // Marcar como revertido na auditoria
      const { error: auditError } = await supabase
        .from('veiculo_field_sources')
        .update({ reverted_at: new Date().toISOString() })
        .eq('id', recordId);

      if (auditError) throw auditError;

      // Criar registro de reversão
      await supabase
        .from('veiculo_field_sources')
        .insert({
          veiculo_id: veiculo.id,
          field_name: record.field_name,
          previous_value: record.new_value,
          new_value: record.previous_value,
          source: 'reversal',
          import_job_id: record.import_job_id
        });

      toast({
        title: "Sucesso",
        description: "Campo revertido com sucesso"
      });

      loadData();

    } catch (error) {
      console.error('Erro ao reverter:', error);
      toast({
        title: "Erro",
        description: "Erro ao reverter campo",
        variant: "destructive"
      });
    }
  };

  const addCategoryMapping = () => {
    if (newMapping.from && newMapping.to) {
      setSettings(prev => ({
        ...prev,
        category_mapping: {
          ...prev.category_mapping,
          [newMapping.from]: newMapping.to
        }
      }));
      setNewMapping({ from: '', to: '' });
    }
  };

  const removeCategoryMapping = (key: string) => {
    setSettings(prev => ({
      ...prev,
      category_mapping: Object.fromEntries(
        Object.entries(prev.category_mapping).filter(([k]) => k !== key)
      )
    }));
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações de Importação</h1>
          <p className="text-muted-foreground">
            Configure o preenchimento automático de dados de veículos
          </p>
        </div>
        <Button onClick={executeNow} disabled={executing}>
          <Play className="w-4 h-4 mr-2" />
          {executing ? 'Executando...' : 'Executar Agora'}
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="w-4 h-4 mr-2" />
            Auditoria
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Upload className="w-4 h-4 mr-2" />
            Jobs de Importação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Preenchimento Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar preenchimento automático após importações
                  </p>
                </div>
                <Switch
                  checked={settings.auto_fill_enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, auto_fill_enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Política de Atualização</Label>
                <Select
                  value={settings.update_policy}
                  onValueChange={(value: any) =>
                    setSettings(prev => ({ ...prev, update_policy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty_only">Somente campos vazios</SelectItem>
                    <SelectItem value="whitelist">Permitir sobrescrever (lista branca)</SelectItem>
                    <SelectItem value="block_conflicts">Bloquear divergências</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>

          {/* Campos Permitidos */}
          {settings.update_policy === 'whitelist' && (
            <Card>
              <CardHeader>
                <CardTitle>Campos Permitidos para Sobrescrita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={settings.allowed_fields.includes(field.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings(prev => ({
                              ...prev,
                              allowed_fields: [...prev.allowed_fields, field.key]
                            }));
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              allowed_fields: prev.allowed_fields.filter(f => f !== field.key)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={field.key}>{field.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mapeamento de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Dicionário de Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="De (família)"
                  value={newMapping.from}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, from: e.target.value }))}
                />
                <Input
                  placeholder="Para (categoria)"
                  value={newMapping.to}
                  onChange={(e) => setNewMapping(prev => ({ ...prev, to: e.target.value }))}
                />
                <Button onClick={addCategoryMapping}>Adicionar</Button>
              </div>

              <div className="space-y-2">
                {Object.entries(settings.category_mapping).map(([from, to]) => (
                  <div key={from} className="flex items-center justify-between p-2 border rounded">
                    <span>{from} → {to}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCategoryMapping(from)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>Valor Anterior</TableHead>
                    <TableHead>Valor Novo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.veiculo_placa}</TableCell>
                      <TableCell>{record.field_name}</TableCell>
                      <TableCell>{record.previous_value || '-'}</TableCell>
                      <TableCell>{record.new_value}</TableCell>
                      <TableCell>
                        <Badge variant={record.source === 'n8n_xlsx' ? 'default' : 'secondary'}>
                          {record.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(record.applied_at).toLocaleString()}</TableCell>
                      <TableCell>
                        {!record.reverted_at && record.source === 'n8n_xlsx' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => revertField(record.id)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        {record.reverted_at && (
                          <Badge variant="outline">Revertido</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs de Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processados</TableHead>
                    <TableHead>Atualizados</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono">{job.job_id}</TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{job.summary?.processed || 0}</TableCell>
                      <TableCell>{job.summary?.updated || 0}</TableCell>
                      <TableCell>{job.summary?.errors || 0}</TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}