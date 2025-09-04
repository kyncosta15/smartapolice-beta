import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Download,
  Upload,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function OptimizedSettings() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      vencimento: 30,
      renovacao: true
    },
    appearance: {
      theme: 'light',
      language: 'pt-BR',
      compactView: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      autoLogout: true
    },
    integration: {
      autoSync: true,
      backupFrequency: 'daily',
      exportFormat: 'pdf'
    }
  });

  const [activeTab, setActiveTab] = useState('notifications');
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const tabs = [
    { value: 'notifications', label: 'Notificações', icon: Bell },
    { value: 'appearance', label: 'Aparência', icon: Palette },
    { value: 'security', label: 'Segurança', icon: Shield },
    { value: 'integration', label: 'Integração', icon: Database },
    { value: 'billing', label: 'Cobrança', icon: CreditCard }
  ];

  const activeTabData = tabs.find(tab => tab.value === activeTab);

  const handleSave = (section: string) => {
    toast({
      title: "Configurações Salvas",
      description: `Configurações de ${section} foram atualizadas com sucesso`,
    });
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold">
            <Settings className="h-6 w-6 mr-2 text-blue-600" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile: Dropdown menu */}
        {isMobile ? (
          <div className="w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-12">
                  <div className="flex items-center space-x-2">
                    {activeTabData && <activeTabData.icon className="h-4 w-4" />}
                    <span>{activeTabData?.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full bg-white border border-gray-200 z-50" align="start">
                {tabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.value}
                    onSelect={() => setActiveTab(tab.value)}
                    className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* Desktop: Regular tabs */
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Canais de Notificação</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">E-mail</Label>
                      <Switch
                        id="email-notifications"
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push</Label>
                      <Switch
                        id="push-notifications"
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications">SMS</Label>
                      <Switch
                        id="sms-notifications"
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Alertas de Vencimento</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="vencimento-days">Avisar com antecedência (dias)</Label>
                      <Select
                        value={settings.notifications.vencimento.toString()}
                        onValueChange={(value) => updateSetting('notifications', 'vencimento', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="60">60 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="renovacao-alerts">Alertas de renovação</Label>
                      <Switch
                        id="renovacao-alerts"
                        checked={settings.notifications.renovacao}
                        onCheckedChange={(checked) => updateSetting('notifications', 'renovacao', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => handleSave('notificações')} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Personalização da Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme-select">Tema</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="language-select">Idioma</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(value) => updateSetting('appearance', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-view">Visualização compacta</Label>
                    <Switch
                      id="compact-view"
                      checked={settings.appearance.compactView}
                      onCheckedChange={(checked) => updateSetting('appearance', 'compactView', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => handleSave('aparência')} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Autenticação de dois fatores</Label>
                      <p className="text-sm text-gray-500">Adiciona uma camada extra de segurança</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={settings.security.twoFactor}
                      onCheckedChange={(checked) => updateSetting('security', 'twoFactor', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-logout">Logout automático</Label>
                      <p className="text-sm text-gray-500">Sair automaticamente após inatividade</p>
                    </div>
                    <Switch
                      id="auto-logout"
                      checked={settings.security.autoLogout}
                      onCheckedChange={(checked) => updateSetting('security', 'autoLogout', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-timeout">Timeout da sessão (minutos)</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => updateSetting('security', 'sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => handleSave('segurança')} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integração */}
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Backup e Integração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-sync">Sincronização automática</Label>
                      <p className="text-sm text-gray-500">Sincronizar dados automaticamente</p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={settings.integration.autoSync}
                      onCheckedChange={(checked) => updateSetting('integration', 'autoSync', checked)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="backup-frequency">Frequência do backup</Label>
                    <Select
                      value={settings.integration.backupFrequency}
                      onValueChange={(value) => updateSetting('integration', 'backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="export-format">Formato de exportação padrão</Label>
                    <Select
                      value={settings.integration.exportFormat}
                      onValueChange={(value) => updateSetting('integration', 'exportFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Dados
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Dados
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => handleSave('integração')} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cobrança */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Plano e Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Plano Atual: Profissional</h3>
                <p className="text-blue-700 text-sm">R$ 99/mês • Próxima cobrança: 20/01/2025</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Recursos Inclusos</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Apólices ilimitadas</li>
                    <li>✓ IA para análise de documentos</li>
                    <li>✓ Relatórios avançados</li>
                    <li>✓ Suporte prioritário</li>
                    <li>✓ API completa</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Ações</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Alterar Plano
                    </Button>
                    <Button variant="outline" className="w-full">
                      Histórico de Faturas
                    </Button>
                    <Button variant="outline" className="w-full">
                      Atualizar Pagamento
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}