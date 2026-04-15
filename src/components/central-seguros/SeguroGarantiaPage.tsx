import { useState, useEffect, useCallback } from 'react';
import { Shield, Wifi, WifiOff, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { GarantiaBillingsPanel } from './garantia/GarantiaBillingsPanel';
import { GarantiaPoliciesPanel } from './garantia/GarantiaPoliciesPanel';
import { GarantiaEndorsementsPanel } from './garantia/GarantiaEndorsementsPanel';
import { GarantiaPolicyholdersPanel } from './garantia/GarantiaPolicyholdersPanel';
import { GarantiaCancellationPanel } from './garantia/GarantiaCancellationPanel';
import { GarantiaEconomicGroupPanel } from './garantia/GarantiaEconomicGroupPanel';
import { GarantiaDocumentPanel } from './garantia/GarantiaDocumentPanel';

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error';

export function SeguroGarantiaPage() {
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seguro Garantia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie apólices, endossos, tomadores e boletos de seguro garantia — integrado à Junto Seguros.
        </p>
      </div>

      {/* Connection Status */}
      <Card className={getStatusTone()}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border border-border bg-background">
                {getStatusIcon()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {connectionStatus === 'idle' ? 'Verificando conexão...' : connectionMessage}
                </p>
                {connectionDetails && (
                  <p className="text-xs text-muted-foreground">{connectionDetails}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <Badge variant="outline" className="text-xs"><CheckCircle2 className="mr-1 size-3" /> API Ativa</Badge>
              )}
              <Button
                onClick={() => testConnection(false)}
                disabled={connectionStatus === 'testing'}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                {connectionStatus === 'testing' ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Apólices</TabsTrigger>
          <TabsTrigger value="endorsements">Endossos</TabsTrigger>
          <TabsTrigger value="policyholders">Tomadores</TabsTrigger>
          <TabsTrigger value="billings">Títulos / Boletos</TabsTrigger>
          <TabsTrigger value="cancellation">Cancelamentos</TabsTrigger>
          <TabsTrigger value="economic-group">Grupos Econômicos</TabsTrigger>
        </TabsList>
        <TabsContent value="policies">
          <GarantiaPoliciesPanel />
        </TabsContent>
        <TabsContent value="endorsements">
          <GarantiaEndorsementsPanel />
        </TabsContent>
        <TabsContent value="policyholders">
          <GarantiaPolicyholdersPanel />
        </TabsContent>
        <TabsContent value="billings">
          <GarantiaBillingsPanel />
        </TabsContent>
        <TabsContent value="cancellation">
          <GarantiaCancellationPanel />
        </TabsContent>
        <TabsContent value="economic-group">
          <GarantiaEconomicGroupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
