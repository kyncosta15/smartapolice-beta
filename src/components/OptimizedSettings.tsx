import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Download,
  Upload,
  CreditCard,
  Menu,
  ArrowLeft,
  User,
  Monitor,
  Globe,
  KeyRound
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/components/UserProfile';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';

interface OptimizedSettingsProps {
  onBackToHome?: () => void;
}

export function OptimizedSettings({ onBackToHome }: OptimizedSettingsProps) {
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

  const [activeSection, setActiveSection] = useState('profile');
  const { toast } = useToast();

  const sections = [
    { value: 'profile', label: 'Meu Perfil', icon: User },
    { value: 'security', label: 'Segurança', icon: KeyRound }
  ];

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

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Meu Perfil
              </h3>
              <p className="text-gray-600 dark:text-muted-foreground mb-6">Gerencie suas informações pessoais</p>
            </div>
            <UserProfile />
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Preferências de Notificação
              </h3>
              <p className="text-gray-600 dark:text-muted-foreground mb-6">Configure como e quando receber notificações</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark:bg-card dark:border">
                <CardHeader>
                  <CardTitle className="text-base dark:text-foreground">Canais de Notificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="dark:text-foreground">E-mail</Label>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Receber notificações por e-mail</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="dark:text-foreground">Push</Label>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Notificações do navegador</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications" className="dark:text-foreground">SMS</Label>
                      <p className="text-sm text-gray-500 dark:text-muted-foreground">Mensagens de texto</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => updateSetting('notifications', 'sms', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alertas de Vencimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <div>
                      <Label htmlFor="renovacao-alerts">Alertas de renovação</Label>
                      <p className="text-sm text-gray-500">Notificar sobre renovações</p>
                    </div>
                    <Switch
                      id="renovacao-alerts"
                      checked={settings.notifications.renovacao}
                      onCheckedChange={(checked) => updateSetting('notifications', 'renovacao', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={() => handleSave('notificações')} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Personalização da Interface
              </h3>
              <p className="text-gray-600 mb-6">Customize a aparência do sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tema e Idioma</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Layout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compact-view">Visualização compacta</Label>
                      <p className="text-sm text-gray-500">Interface mais densa</p>
                    </div>
                    <Switch
                      id="compact-view"
                      checked={settings.appearance.compactView}
                      onCheckedChange={(checked) => updateSetting('appearance', 'compactView', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={() => handleSave('aparência')} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <KeyRound className="h-5 w-5 mr-2" />
                Segurança da Conta
              </h3>
              <p className="text-muted-foreground mb-6">Gerencie sua senha e configurações de segurança</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChangePasswordForm />

              <Card className="dark:bg-card dark:border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 dark:text-foreground">
                    <Shield className="w-4 h-4" />
                    Dicas de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Use uma senha forte com letras, números e símbolos</p>
                    <p>• Não compartilhe sua senha com terceiros</p>
                    <p>• Altere sua senha regularmente</p>
                    <p>• Nunca use a mesma senha em diferentes serviços</p>
                    <p>• Faça logout ao usar computadores públicos</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Configurações do Sistema
              </h3>
              <p className="text-gray-600 mb-6">Gerencie as configurações gerais do sistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cache automático</Label>
                      <p className="text-sm text-gray-500">Melhorar velocidade de carregamento</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compressão de imagens</Label>
                      <p className="text-sm text-gray-500">Otimizar tamanho das imagens</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logs do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log de atividades</Label>
                      <p className="text-sm text-gray-500">Registrar ações dos usuários</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log de erros</Label>
                      <p className="text-sm text-gray-500">Registrar erros do sistema</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={() => handleSave('sistema')} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </div>
          </div>
        );

      case 'integration':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Backup e Integração
              </h3>
              <p className="text-gray-600 mb-6">Configure backups e integrações externas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Backup Automático</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Exportação de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4 border-t">
              <Button onClick={() => handleSave('integração')} className="bg-blue-600 hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Plano e Cobrança
              </h3>
              <p className="text-gray-600 mb-6">Gerencie seu plano e informações de pagamento</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800 text-lg">Plano Atual: Profissional</h3>
                  <p className="text-blue-700 text-sm mt-1">R$ 99/mês • Próxima cobrança: 20/01/2025</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Ativo
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recursos Inclusos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Apólices ilimitadas
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      IA para análise de documentos
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Relatórios avançados
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Suporte prioritário
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      API completa
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Alterar Plano
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Histórico de Faturas
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Atualizar Pagamento
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Configurações</h1>
              <p className="text-gray-600 dark:text-muted-foreground mt-1">Gerencie suas preferências e configurações do sistema</p>
            </div>
            {onBackToHome && (
              <Button variant="ghost" onClick={onBackToHome} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="h-10 p-1 mb-8 dark:bg-muted inline-flex">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.value} 
                value={section.value}
                className="flex items-center justify-center gap-2 px-4 text-sm dark:data-[state=active]:bg-background"
              >
                <section.icon className="h-4 w-4" />
                <span>{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="bg-white dark:bg-card rounded-lg shadow-sm border dark:border-border min-h-[600px]">
            {sections.map((section) => (
              <TabsContent key={section.value} value={section.value} className="p-6 sm:p-8">
                {renderContent()}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}