import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Webhook, Save, RefreshCw, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

interface WebhookConfig {
  id: string;
  nome: string;
  descricao: string | null;
  url: string;
  ativo: boolean;
  updated_at: string;
}

export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedUrls, setEditedUrls] = useState<Record<string, string>>({});

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('n8n_webhooks_config')
        .select('*')
        .order('nome');

      if (error) throw error;
      setWebhooks(data || []);
      
      // Initialize edited URLs
      const urls: Record<string, string> = {};
      data?.forEach(w => { urls[w.id] = w.url; });
      setEditedUrls(urls);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar configurações de webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleSave = async (webhook: WebhookConfig) => {
    const newUrl = editedUrls[webhook.id];
    if (!newUrl?.trim()) {
      toast.error('URL não pode estar vazia');
      return;
    }

    setSaving(webhook.id);
    try {
      const { error } = await supabase
        .from('n8n_webhooks_config')
        .update({ url: newUrl.trim() })
        .eq('id', webhook.id);

      if (error) throw error;
      
      toast.success(`URL do webhook "${webhook.nome}" atualizada`);
      fetchWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Erro ao salvar webhook');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleAtivo = async (webhook: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from('n8n_webhooks_config')
        .update({ ativo: !webhook.ativo })
        .eq('id', webhook.id);

      if (error) throw error;
      
      toast.success(`Webhook "${webhook.nome}" ${!webhook.ativo ? 'ativado' : 'desativado'}`);
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Erro ao alterar status do webhook');
    }
  };

  const hasChanges = (webhook: WebhookConfig) => {
    return editedUrls[webhook.id] !== webhook.url;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Webhook className="h-6 w-6 text-primary" />
              Configuração de Webhooks N8N
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as URLs dos webhooks de integração com o N8N
            </p>
          </div>
          <Button variant="outline" onClick={fetchWebhooks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Quando você precisar trocar a URL do N8N (a cada 14 dias no plano gratuito), 
              basta editar a URL aqui e salvar. Não é necessário alterar código.
            </p>
          </CardContent>
        </Card>

        {/* Webhooks List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum webhook configurado
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className={!webhook.ativo ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{webhook.nome}</CardTitle>
                      <Badge variant={webhook.ativo ? 'default' : 'secondary'}>
                        {webhook.ativo ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`ativo-${webhook.id}`} className="text-sm text-muted-foreground">
                        {webhook.ativo ? 'Ativo' : 'Inativo'}
                      </Label>
                      <Switch
                        id={`ativo-${webhook.id}`}
                        checked={webhook.ativo}
                        onCheckedChange={() => handleToggleAtivo(webhook)}
                      />
                    </div>
                  </div>
                  {webhook.descricao && (
                    <CardDescription>{webhook.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`url-${webhook.id}`}>URL do Webhook</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`url-${webhook.id}`}
                        value={editedUrls[webhook.id] || ''}
                        onChange={(e) => setEditedUrls(prev => ({ ...prev, [webhook.id]: e.target.value }))}
                        placeholder="https://..."
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(editedUrls[webhook.id], '_blank')}
                        title="Abrir URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Última atualização: {formatDate(webhook.updated_at)}
                    </span>
                    <Button
                      onClick={() => handleSave(webhook)}
                      disabled={!hasChanges(webhook) || saving === webhook.id}
                      size="sm"
                    >
                      {saving === webhook.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ID Reference */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Referência de IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1 font-mono">
              <li><strong>pdf_frota</strong> - Upload de PDFs de cotações de frota</li>
              <li><strong>planilha_frota</strong> - Upload de planilhas Excel de frota</li>
              <li><strong>apolices_pdf</strong> - Upload de PDFs de apólices gerais</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
