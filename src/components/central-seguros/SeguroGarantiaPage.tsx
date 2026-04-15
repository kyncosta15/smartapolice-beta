import { useState } from 'react';
import { Shield, FileText, Clock, CheckCircle2, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        body: { environment: 'production' },
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
        if (typeof data.validation_status === 'number') details.push(`Validação Bearer: HTTP ${data.validation_status}`);
        if (data.validation_details) details.push(String(data.validation_details));

        setConnectionDetails(details.join(' • '));
        toast.success('Conexão estabelecida com a Junto Seguros!');
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data?.error || 'Falha na autenticação');
        setConnectionDetails(data?.details || '');
        toast.error('Falha na autenticação com a Junto Seguros');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage('Erro inesperado ao testar conexão');
      setConnectionDetails(err.message);
      toast.error('Erro inesperado');
    }
  };

  const getStatusTone = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'border border-primary/30 bg-primary/5';
      case 'error':
        return 'border border-destructive/30 bg-destructive/5';
      case 'testing':
        return 'border border-primary/30 bg-primary/5';
      default:
        return 'border border-border bg-card';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="size-5 text-primary" />;
      case 'error':
        return <WifiOff className="size-5 text-destructive" />;
      case 'testing':
        return <Loader2 className="size-5 text-primary animate-spin" />;
      default:
        return <Shield className="size-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seguro Garantia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas apólices de seguro garantia — licitações, contratos e judiciais.
        </p>
      </div>

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
                    Teste a conexão com a API para começar a sincronizar apólices.
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
              {connectionStatus === 'testing' ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              {connectionStatus === 'connected' ? 'Testar novamente' : 'Testar conexão'}
            </Button>
          </div>

          {connectionStatus === 'connected' && (
            <div className="mt-4 flex gap-2">
              <Badge variant="outline">
                <CheckCircle2 className="mr-1 size-3" /> Autenticado
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Apólices Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Vencendo em 30 dias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">R$ 0</p>
              <p className="text-xs text-muted-foreground">Importância Segurada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Apólices de Seguro Garantia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Shield className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Nenhuma apólice cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {connectionStatus === 'connected'
                ? 'Conexão estabelecida! O accessToken já está sendo enviado no Bearer para autenticar as próximas chamadas.'
                : 'Teste a conexão com a Junto Seguros acima para começar a sincronizar apólices.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
