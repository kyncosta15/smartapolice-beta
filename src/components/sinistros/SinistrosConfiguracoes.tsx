import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Mail, 
  Bell, 
  Users, 
  Shield, 
  Clock,
  Database,
  Webhook,
  MessageSquare,
  Save,
  TestTube,
  AlertTriangle
} from 'lucide-react';

interface SinistrosConfiguracoesProps {
  onConfigSaved: (config: any) => void;
}

export function SinistrosConfiguracoes({ onConfigSaved }: SinistrosConfiguracoesProps) {
  const [emailTemplates, setEmailTemplates] = useState({
    abertura: {
      assunto: 'Seu sinistro foi aberto — [PLACA] | [Nº Ticket]',
      corpo: `Olá, [NOME],\nRegistramos a abertura do seu sinistro referente ao veículo [PLACA] em [DATA_OCORRENCIA].\nStatus inicial: ABERTO.\n\nPendências iniciais:\n- Boletim de Ocorrência\n- Laudo da oficina\n- CRLV atualizado\n\nVocê pode acompanhar e enviar documentos por este link seguro:\n[LINK_DIRETO]\n\nQualquer dúvida, responda este e-mail.\nAtenciosamente,\nEquipe RCaldas Seguros`
    },
    pendencia: {
      assunto: 'Documentos pendentes — Sinistro [Nº Ticket]',
      corpo: `Olá, [NOME],\nAinda precisamos dos documentos abaixo para avançar:\n- [LISTA_PENDENCIAS]\n\nEnvie-os pelo link seguro:\n[LINK_DIRETO]\n\nObrigado!\nEquipe RCaldas Seguros`
    },
    encerramento: {
      assunto: 'Sinistro encerrado — [PLACA] | [Nº Ticket]',
      corpo: `Olá, [NOME],\nSeu sinistro foi encerrado em [DATA_ENCERRAMENTO].\nResumo financeiro:\n- Indenização paga: R$ [INDENIZACAO_PAGA]\n- Gastos de reparo: R$ [GASTOS_REPARO_PAGOS]\n\nBaixe o relatório em PDF:\n[LINK_PDF]\n\nA RCaldas agradece a confiança.`
    }
  });

  const [slaConfig, setSlaConfig] = useState({
    sla_alvo_dias: 15,
    alerta_50_percent: true,
    alerta_80_percent: true,
    alerta_ultrapassado: true,
    email_gestor: 'gestor@rcaldas.com.br'
  });

  const [alertasConfig, setAlertasConfig] = useState({
    crlv_30_dias: true,
    crlv_15_dias: true,
    crlv_7_dias: true,
    crlv_vencido: true,
    email_alerts: true,
    whatsapp_alerts: false,
    push_notifications: true
  });

  const [integracoesConfig, setIntegracoes] = useState({
    crlv_api_endpoint: 'https://api.crlv.gov.br/v1',
    crlv_api_key: '',
    webhook_url: '',
    webhook_secret: '',
    email_provider: 'resend',
    whatsapp_provider: 'whatsapp_business'
  });

  const [permissoesConfig, setPermissoes] = useState({
    analista: {
      abrir_ticket: true,
      editar_ticket: true,
      encerrar_ticket: false,
      ver_financeiro: false,
      exportar_relatorios: false,
      configurar_alertas: false
    },
    gestor: {
      abrir_ticket: true,
      editar_ticket: true,
      encerrar_ticket: true,
      ver_financeiro: true,
      exportar_relatorios: true,
      configurar_alertas: true
    },
    admin: {
      abrir_ticket: true,
      editar_ticket: true,
      encerrar_ticket: true,
      ver_financeiro: true,
      exportar_relatorios: true,
      configurar_alertas: true
    }
  });

  const handleTemplateChange = (type: string, field: string, value: string) => {
    setEmailTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSlaConfigChange = (field: string, value: any) => {
    setSlaConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleAlertasConfigChange = (field: string, value: any) => {
    setAlertasConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleIntegracoesChange = (field: string, value: string) => {
    setIntegracoes(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissaoChange = (role: string, permission: string, value: boolean) => {
    setPermissoes(prev => ({
      ...prev,
      [role]: {
        ...prev[role as keyof typeof prev],
        [permission]: value
      }
    }));
  };

  const testEmailTemplate = (type: string) => {
    alert(`Enviando email de teste para o template: ${type}\n\nEm um sistema real, um email seria enviado para verificar a formatação e conteúdo.`);
  };

  const testWebhook = () => {
    alert('Testando webhook...\n\nEm um sistema real, uma requisição seria enviada para o endpoint configurado.');
  };

  const saveAllConfigurations = () => {
    const config = {
      emailTemplates,
      slaConfig,
      alertasConfig,
      integracoesConfig,
      permissoesConfig,
      savedAt: new Date().toISOString()
    };

    onConfigSaved(config);
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
          <p className="text-muted-foreground">
            Configure templates, alertas, integrações e permissões
          </p>
        </div>
        
        <Button onClick={saveAllConfigurations}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Todas
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
        </TabsList>

        {/* Email Templates */}
        <TabsContent value="templates">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Templates de Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(emailTemplates).map(([type, template]) => (
                  <Card key={type}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm capitalize">
                          {type === 'abertura' ? 'Abertura de Sinistro' :
                           type === 'pendencia' ? 'Documentos Pendentes' : 'Encerramento'}
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => testEmailTemplate(type)}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          Testar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor={`${type}-assunto`}>Assunto</Label>
                        <Input
                          id={`${type}-assunto`}
                          value={template.assunto}
                          onChange={(e) => handleTemplateChange(type, 'assunto', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${type}-corpo`}>Corpo do Email</Label>
                        <Textarea
                          id={`${type}-corpo`}
                          value={template.corpo}
                          onChange={(e) => handleTemplateChange(type, 'corpo', e.target.value)}
                          rows={8}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        '[NOME]', '[PLACA]', '[Nº Ticket]', '[DATA_OCORRENCIA]',
                        '[DATA_ENCERRAMENTO]', '[LINK_DIRETO]', '[LISTA_PENDENCIAS]',
                        '[INDENIZACAO_PAGA]', '[GASTOS_REPARO_PAGOS]', '[LINK_PDF]'
                      ].map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLA Configuration */}
        <TabsContent value="sla">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Configuração de SLA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sla-alvo">SLA Alvo (dias)</Label>
                  <Input
                    id="sla-alvo"
                    type="number"
                    value={slaConfig.sla_alvo_dias}
                    onChange={(e) => handleSlaConfigChange('sla_alvo_dias', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="email-gestor">Email do Gestor</Label>
                  <Input
                    id="email-gestor"
                    type="email"
                    value={slaConfig.email_gestor}
                    onChange={(e) => handleSlaConfigChange('email_gestor', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Alertas de SLA</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">50% do prazo atingido</p>
                      <p className="text-sm text-muted-foreground">
                        Alerta quando atingir {Math.round(slaConfig.sla_alvo_dias * 0.5)} dias
                      </p>
                    </div>
                    <Switch
                      checked={slaConfig.alerta_50_percent}
                      onCheckedChange={(checked) => handleSlaConfigChange('alerta_50_percent', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">80% do prazo atingido</p>
                      <p className="text-sm text-muted-foreground">
                        Alerta quando atingir {Math.round(slaConfig.sla_alvo_dias * 0.8)} dias
                      </p>
                    </div>
                    <Switch
                      checked={slaConfig.alerta_80_percent}
                      onCheckedChange={(checked) => handleSlaConfigChange('alerta_80_percent', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SLA ultrapassado</p>
                      <p className="text-sm text-muted-foreground">
                        Alerta quando ultrapassar {slaConfig.sla_alvo_dias} dias
                      </p>
                    </div>
                    <Switch
                      checked={slaConfig.alerta_ultrapassado}
                      onCheckedChange={(checked) => handleSlaConfigChange('alerta_ultrapassado', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Configuration */}
        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuração de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Alertas de CRLV</Label>
                <div className="space-y-3 mt-3">
                  {[
                    { key: 'crlv_30_dias', label: '30 dias antes do vencimento' },
                    { key: 'crlv_15_dias', label: '15 dias antes do vencimento' },
                    { key: 'crlv_7_dias', label: '7 dias antes do vencimento' },
                    { key: 'crlv_vencido', label: 'CRLV vencido' }
                  ].map((alert) => (
                    <div key={alert.key} className="flex items-center justify-between">
                      <span>{alert.label}</span>
                      <Switch
                        checked={alertasConfig[alert.key as keyof typeof alertasConfig] as boolean}
                        onCheckedChange={(checked) => handleAlertasConfigChange(alert.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Canais de Notificação</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <Switch
                      checked={alertasConfig.email_alerts}
                      onCheckedChange={(checked) => handleAlertasConfigChange('email_alerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </div>
                    <Switch
                      checked={alertasConfig.whatsapp_alerts}
                      onCheckedChange={(checked) => handleAlertasConfigChange('whatsapp_alerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Push Notifications</span>
                    </div>
                    <Switch
                      checked={alertasConfig.push_notifications}
                      onCheckedChange={(checked) => handleAlertasConfigChange('push_notifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Configuration */}
        <TabsContent value="integracoes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API do CRLV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="crlv-endpoint">Endpoint da API</Label>
                  <Input
                    id="crlv-endpoint"
                    value={integracoesConfig.crlv_api_endpoint}
                    onChange={(e) => handleIntegracoesChange('crlv_api_endpoint', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="crlv-key">Chave da API</Label>
                  <Input
                    id="crlv-key"
                    type="password"
                    value={integracoesConfig.crlv_api_key}
                    onChange={(e) => handleIntegracoesChange('crlv_api_key', e.target.value)}
                    placeholder="Insira a chave da API do CRLV"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    value={integracoesConfig.webhook_url}
                    onChange={(e) => handleIntegracoesChange('webhook_url', e.target.value)}
                    placeholder="https://seu-sistema.com/webhook/sinistros"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-secret">Secret do Webhook</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={integracoesConfig.webhook_secret}
                    onChange={(e) => handleIntegracoesChange('webhook_secret', e.target.value)}
                    placeholder="Chave secreta para validação"
                  />
                </div>
                <Button variant="outline" onClick={testWebhook}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Provedores de Comunicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-provider">Provedor de Email</Label>
                  <Select 
                    value={integracoesConfig.email_provider} 
                    onValueChange={(value) => handleIntegracoesChange('email_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="whatsapp-provider">Provedor de WhatsApp</Label>
                  <Select 
                    value={integracoesConfig.whatsapp_provider} 
                    onValueChange={(value) => handleIntegracoesChange('whatsapp_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp_business">WhatsApp Business API</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="zenvia">Zenvia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Configuration */}
        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Permissões por Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissoesConfig).map(([role, permissions]) => (
                  <Card key={role}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm capitalize flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role === 'analista' ? 'Analista' : role === 'gestor' ? 'Gestor' : 'Administrador'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(permissions).map(([permission, enabled]) => (
                          <div key={permission} className="flex items-center justify-between">
                            <span className="text-sm">
                              {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(checked) => handlePermissaoChange(role, permission, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Segurança e Conformidade</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Todas as configurações são criptografadas e armazenadas com segurança. 
                As alterações são registradas em logs de auditoria com timestamp e usuário responsável. 
                Certifique-se de que apenas usuários autorizados tenham acesso a estas configurações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}