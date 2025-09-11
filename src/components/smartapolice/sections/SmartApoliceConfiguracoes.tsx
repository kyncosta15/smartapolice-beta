import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Bell, 
  Database,
  Download,
  Upload,
  RefreshCw,
  Shield,
  Eye,
  Key,
  Users,
  Globe,
  Smartphone
} from 'lucide-react';

export function SmartApoliceConfiguracoes() {
  const [settings, setSettings] = useState({
    // Notificações
    alertasVencimento: true,
    alertasVencimento30: true,
    alertasVencimento60: false,
    alertasPagamentos: true,
    alertasDocumentos: true,
    emailNotifications: true,
    smsNotifications: false,
    
    // FIPE e Conectores
    atualizacaoFipeAutomatica: true,
    frequenciaFipe: 'semanal',
    fonteFipe: 'oficial',
    
    // Dados e Backup
    backupAutomatico: true,
    retencaoDados: '12meses',
    
    // Interface
    temaEscuro: false,
    compactMode: false,
    
    // Segurança
    autenticacao2FA: false,
    sessaoTimeout: '30min',
    
    // Permissões
    permitirExportacao: true,
    permitirImportacao: true,
    logAuditoria: true
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    console.log('Salvando configurações:', settings);
    // Aqui seria implementado o salvamento real
  };

  const handleResetSettings = () => {
    console.log('Resetando configurações para padrão');
    // Aqui seria implementado o reset
  };

  const handleExportSettings = () => {
    console.log('Exportando configurações');
    // Aqui seria implementada a exportação
  };

  const handleImportSettings = () => {
    console.log('Importando configurações');
    // Aqui seria implementada a importação
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">
            Configurações gerais do sistema SmartApolice
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={handleImportSettings}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={handleSaveSettings}>
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificações e Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Alertas de Vencimento</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas de Vencimento
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificar sobre vencimentos de apólices
                  </p>
                </div>
                <Switch
                  checked={settings.alertasVencimento}
                  onCheckedChange={(value) => updateSetting('alertasVencimento', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas 30 dias antes
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificar 30 dias antes do vencimento
                  </p>
                </div>
                <Switch
                  checked={settings.alertasVencimento30}
                  onCheckedChange={(value) => updateSetting('alertasVencimento30', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas 60 dias antes
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificar 60 dias antes do vencimento
                  </p>
                </div>
                <Switch
                  checked={settings.alertasVencimento60}
                  onCheckedChange={(value) => updateSetting('alertasVencimento60', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas de Pagamentos
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificar sobre pagamentos pendentes
                  </p>
                </div>
                <Switch
                  checked={settings.alertasPagamentos}
                  onCheckedChange={(value) => updateSetting('alertasPagamentos', value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Canais de Notificação</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notificações por Email
                  </label>
                  <p className="text-xs text-gray-500">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(value) => updateSetting('emailNotifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Notificações por SMS
                  </label>
                  <p className="text-xs text-gray-500">
                    Receber notificações por SMS
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(value) => updateSetting('smsNotifications', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Alertas de Documentos
                  </label>
                  <p className="text-xs text-gray-500">
                    Notificar sobre documentos pendentes
                  </p>
                </div>
                <Switch
                  checked={settings.alertasDocumentos}
                  onCheckedChange={(value) => updateSetting('alertasDocumentos', value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIPE and Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Conectores FIPE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Atualização Automática FIPE
                  </label>
                  <p className="text-xs text-gray-500">
                    Atualizar valores FIPE automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.atualizacaoFipeAutomatica}
                  onCheckedChange={(value) => updateSetting('atualizacaoFipeAutomatica', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência de Atualização
                </label>
                <select
                  value={settings.frequenciaFipe}
                  onChange={(e) => updateSetting('frequenciaFipe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!settings.atualizacaoFipeAutomatica}
                >
                  <option value="diaria">Diária</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fonte dos Dados FIPE
                </label>
                <select
                  value={settings.fonteFipe}
                  onChange={(e) => updateSetting('fonteFipe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="oficial">FIPE Oficial</option>
                  <option value="backup">Fonte Backup</option>
                  <option value="ambas">Ambas (Fallback)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Testar Conexão
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Logs
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data and Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Dados e Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Backup Automático
                  </label>
                  <p className="text-xs text-gray-500">
                    Fazer backup automático dos dados
                  </p>
                </div>
                <Switch
                  checked={settings.backupAutomatico}
                  onCheckedChange={(value) => updateSetting('backupAutomatico', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retenção de Dados
                </label>
                <select
                  value={settings.retencaoDados}
                  onChange={(e) => updateSetting('retencaoDados', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="6meses">6 meses</option>
                  <option value="12meses">12 meses</option>
                  <option value="24meses">24 meses</option>
                  <option value="indefinido">Indefinido</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Fazer Backup Manual
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar Backup
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Último backup: 10/09/2025 às 14:30</p>
                <p>Próximo backup: 11/09/2025 às 02:00</p>
                <p>Tamanho atual: 2.5 GB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Segurança e Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Autenticação de Dois Fatores
                  </label>
                  <p className="text-xs text-gray-500">
                    Ativar 2FA para maior segurança
                  </p>
                </div>
                <Switch
                  checked={settings.autenticacao2FA}
                  onCheckedChange={(value) => updateSetting('autenticacao2FA', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout da Sessão
                </label>
                <select
                  value={settings.sessaoTimeout}
                  onChange={(e) => updateSetting('sessaoTimeout', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="15min">15 minutos</option>
                  <option value="30min">30 minutos</option>
                  <option value="1hora">1 hora</option>
                  <option value="4horas">4 horas</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Log de Auditoria
                  </label>
                  <p className="text-xs text-gray-500">
                    Registrar todas as ações no sistema
                  </p>
                </div>
                <Switch
                  checked={settings.logAuditoria}
                  onCheckedChange={(value) => updateSetting('logAuditoria', value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Permitir Exportação
                  </label>
                  <p className="text-xs text-gray-500">
                    Usuários podem exportar dados
                  </p>
                </div>
                <Switch
                  checked={settings.permitirExportacao}
                  onCheckedChange={(value) => updateSetting('permitirExportacao', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Permitir Importação
                  </label>
                  <p className="text-xs text-gray-500">
                    Usuários podem importar arquivos
                  </p>
                </div>
                <Switch
                  checked={settings.permitirImportacao}
                  onCheckedChange={(value) => updateSetting('permitirImportacao', value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Gerenciar API Keys
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Permissões
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Interface e Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Tema Escuro
                  </label>
                  <p className="text-xs text-gray-500">
                    Usar tema escuro na interface
                  </p>
                </div>
                <Switch
                  checked={settings.temaEscuro}
                  onCheckedChange={(value) => updateSetting('temaEscuro', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Modo Compacto
                  </label>
                  <p className="text-xs text-gray-500">
                    Reduzir espaçamentos na interface
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(value) => updateSetting('compactMode', value)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma do Sistema
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuso Horário
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleResetSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Configurações
          </Button>
          <Button onClick={handleSaveSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Salvar Todas as Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}