import { useState } from 'react';
import { Shield, Wifi, WifiOff, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GarantiaBillingsPanel } from './garantia/GarantiaBillingsPanel';

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';

export function SeguroGarantiaPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connectionDetails, setConnectionDetails] = useState('');

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Testando conexão com a Junto Seguros...');
    setConnectionDetails('');

    try {
      const { data, error } = await supabase.functions.invoke('junto-garantia-auth', {
        body: { environment: 'sandbox' },
      });

      if (error) {
        setConnectionStatus('error');
        setConnectionMessage('Erro ao conectar com a Edge Function');
        setConnectionDetails(error.message);
        toast.error('Falha na conexão');
        return;
      }

      if (data?.success) {
        setConnectionStatus('connected');
        setConnectionMessage(data?.message || 'Conectado com sucesso à API Junto Seguros!');
        const details: string[] = [];
        details.push(`Ambiente: ${data.environment === 'production' ? 'Produção' : 'Sandbox'}`);
        if (data.expires_in) details.push(`Token expira em ${Math.round(data.expires_in / 60)} min`);
        setConnectionDetails(details.join(' • '));
        toast.success('Conexão estabelecida com a Junto Seguros!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data?.error || 'Falha na autenticação');
        setConnectionDetails(data?.details || '');
        toast.error('Falha na autenticação');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage('Erro inesperado');
      setConnectionDetails(err.message);
      toast.error('Erro inesperado');
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seguro Garantia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie títulos, apólices e boletos de seguro garantia — integrado à Junto Seguros.
        </p>
      </div>

      {/* Connection Card */}
      <Card className={getStatusTone()}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl border border-border bg-background">
                {getStatusIcon()}
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {connectionStatus === 'idle' ? 'Integração Junto Seguros' : connectionMessage}
                </p>
                {connectionStatus === 'idle' && (
                  <p className="text-sm text-muted-foreground">
                    Teste a conexão com a API para começar a sincronizar títulos.
                  </p>
                )}
                {connectionDetails && (
                  <p className="text-xs text-muted-foreground">{connectionDetails}</p>
                )}
              </div>
            </div>
            <Button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              variant={connectionStatus === 'connected' ? 'outline' : 'default'}
              size="sm"
            >
              {connectionStatus === 'testing' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              {connectionStatus === 'connected' ? 'Testar novamente' : 'Testar conexão'}
            </Button>
          </div>
          {connectionStatus === 'connected' && (
            <div className="mt-4 flex gap-2">
              <Badge variant="outline"><CheckCircle2 className="mr-1 size-3" /> Autenticado</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billings Panel */}
      <GarantiaBillingsPanel />
    </div>
  );
}
