import { useState, useEffect, useCallback } from 'react';
import { Shield, Wifi, WifiOff, Loader2, RefreshCw, CheckCircle2, ArrowLeft, FileText, Users, Receipt, XCircle, Building2, FolderOpen, TrendingUp, Scale, Search, FileEdit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { GarantiaBillingsPanel } from './garantia/GarantiaBillingsPanel';
import { GarantiaPoliciesPanel } from './garantia/GarantiaPoliciesPanel';
import { GarantiaEndorsementsPanel } from './garantia/GarantiaEndorsementsPanel';
import { GarantiaPolicyholdersPanel } from './garantia/GarantiaPolicyholdersPanel';
import { GarantiaCancellationPanel } from './garantia/GarantiaCancellationPanel';
import { GarantiaEconomicGroupPanel } from './garantia/GarantiaEconomicGroupPanel';
import { GarantiaDocumentPanel } from './garantia/GarantiaDocumentPanel';
import { GarantiaFilesPanel } from './garantia/GarantiaFilesPanel';
import { GarantiaInsuredPanel } from './garantia/GarantiaInsuredPanel';
import { GarantiaIncreaseValuePanel } from './garantia/GarantiaIncreaseValuePanel';
import { GarantiaJudicialCivilPanel } from './garantia/GarantiaJudicialCivilPanel';

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';
type ActiveView = 'home' | 'policies' | 'endorsements' | 'policyholders' | 'billings' | 'cancellation' | 'document' | 'files' | 'increasevalue' | 'economic-group' | 'insured' | 'judicial-civil';

const modules: { key: ActiveView; label: string; desc: string; icon: React.ElementType; span?: 'full' | 'half' }[] = [
  { key: 'policies', label: 'Apólices', desc: 'Consultar e sincronizar apólices emitidas', icon: Shield },
  { key: 'endorsements', label: 'Endossos', desc: 'Listar e filtrar endossos por tipo', icon: FileEdit },
  { key: 'policyholders', label: 'Tomadores', desc: 'Dados cadastrais, limites e rating', icon: Users },
  { key: 'billings', label: 'Títulos / Boletos', desc: 'Parcelas, vencimentos e pagamentos', icon: Receipt },
  { key: 'cancellation', label: 'Cancelamentos', desc: 'Solicitar e acompanhar cancelamentos', icon: XCircle },
  { key: 'increasevalue', label: 'Aumento IS', desc: 'Endosso de aumento de importância segurada', icon: TrendingUp },
  { key: 'judicial-civil', label: 'Judicial Civil', desc: 'Cotação, minuta e emissão judicial', icon: Scale },
  { key: 'insured', label: 'Segurados', desc: 'Consultar segurados cadastrados', icon: Search },
  { key: 'economic-group', label: 'Grupos Econômicos', desc: 'Consultar grupos econômicos', icon: Building2 },
  { key: 'document', label: 'Documento', desc: 'Buscar documentos de apólice', icon: FileText },
  { key: 'files', label: 'Arquivos', desc: 'Download de arquivos e boletos', icon: FolderOpen },
];

export function SeguroGarantiaPage() {
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectionDetails, setConnectionDetails] = useState('');

  const testConnection = useCallback(async (silent = false) => {
    setConnectionStatus('testing');
    if (!silent) setConnectionMessage('Testando conexão com a Junto Seguros...');
    setConnectionDetails('');

    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-auth', {
        body: { environment: 'sandbox' },
      });

      if (error) {
        setConnectionStatus('error');
        setConnectionMessage('Erro ao conectar com a Edge Function');
        setConnectionDetails(error.message);
        return;
      }

      if (data?.success) {
        setConnectionStatus('connected');
        setConnectionMessage(data?.message || 'Conectado com sucesso à API Junto Seguros!');
        const details: string[] = [];
        details.push(`Ambiente: ${data.environment === 'production' ? 'Produção' : 'Sandbox'}`);
        if (data.expires_in) details.push(`Token expira em ${Math.round(data.expires_in / 60)} min`);
        setConnectionDetails(details.join(' • '));
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data?.error || 'Falha na autenticação');
        setConnectionDetails(data?.details || '');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage('Erro inesperado');
      setConnectionDetails(err.message);
    }
  }, []);

  useEffect(() => {
    testConnection(true);
  }, [testConnection]);

  const getStatusTone = () => {
    switch (connectionStatus) {
      case 'connected': return 'border border-primary/30 bg-primary/5';
      case 'error': return 'border border-destructive/30 bg-destructive/5';
      case 'testing': return 'border border-primary/30 bg-primary/5';
      default: return 'border border-border bg-card';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="size-5 text-primary" />;
      case 'error': return <WifiOff className="size-5 text-destructive" />;
      case 'testing': return <Loader2 className="size-5 text-primary animate-spin" />;
      default: return <Shield className="size-5 text-muted-foreground" />;
    }
  };

  const renderPanel = () => {
    switch (activeView) {
      case 'policies': return <GarantiaPoliciesPanel />;
      case 'endorsements': return <GarantiaEndorsementsPanel />;
      case 'policyholders': return <GarantiaPolicyholdersPanel />;
      case 'billings': return <GarantiaBillingsPanel />;
      case 'cancellation': return <GarantiaCancellationPanel />;
      case 'document': return <GarantiaDocumentPanel />;
      case 'files': return <GarantiaFilesPanel />;
      case 'increasevalue': return <GarantiaIncreaseValuePanel />;
      case 'economic-group': return <GarantiaEconomicGroupPanel />;
      case 'insured': return <GarantiaInsuredPanel />;
      case 'judicial-civil': return <GarantiaJudicialCivilPanel />;
      default: return null;
    }
  };

  const activeModule = modules.find(m => m.key === activeView);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {activeView !== 'home' && (
          <Button variant="ghost" size="icon" onClick={() => setActiveView('home')} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeView === 'home' ? 'Seguro Garantia' : activeModule?.label || 'Seguro Garantia'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeView === 'home'
              ? 'Gerencie apólices, endossos, tomadores e boletos — integrado à Junto Seguros.'
              : activeModule?.desc}
          </p>
        </div>
      </div>

      {/* Connection Status — compact */}
      <Card className={getStatusTone()}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg border border-border bg-background">
                {getStatusIcon()}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {connectionStatus === 'idle' ? 'Verificando conexão...' : connectionMessage}
                </p>
                {connectionDetails && (
                  <p className="text-[11px] text-muted-foreground">{connectionDetails}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <Badge variant="outline" className="text-[10px] h-5"><CheckCircle2 className="mr-1 size-2.5" /> API Ativa</Badge>
              )}
              <Button
                onClick={() => testConnection(false)}
                disabled={connectionStatus === 'testing'}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
              >
                {connectionStatus === 'testing' ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home — Module Cards */}
      {activeView === 'home' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.key}
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => setActiveView(mod.key)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm text-foreground">{mod.label}</h3>
                    <p className="text-xs text-muted-foreground truncate">{mod.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        renderPanel()
      )}
    </div>
  );
}
