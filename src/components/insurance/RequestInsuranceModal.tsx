import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, KeyRound, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ADMIN_CODE = 'ADM#2026';

interface RequestInsuranceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo: {
    id: string;
    placa: string;
    marca?: string;
    modelo?: string;
    status_seguro: string;
  };
  empresaId: string;
  onSubmit: (params: {
    veiculo_id: string;
    empresa_id: string;
    current_status: string;
    requested_status: string;
    motivo?: string;
  }) => Promise<boolean>;
}

export function RequestInsuranceModal({
  open,
  onOpenChange,
  veiculo,
  empresaId,
  onSubmit,
}: RequestInsuranceModalProps) {
  const [mode, setMode] = useState<'choice' | 'code'>('choice');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setMode('choice');
    setCode('');
    setCodeError('');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const handleWaitApproval = async () => {
    setLoading(true);
    try {
      const success = await onSubmit({
        veiculo_id: veiculo.id,
        empresa_id: empresaId,
        current_status: veiculo.status_seguro,
        requested_status: 'segurado',
        motivo: 'Solicitação de alteração para status Segurado',
      });
      if (success) {
        handleOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setCodeError('Digite o código de aprovação');
      return;
    }
    if (code.trim().toUpperCase() !== ADMIN_CODE) {
      setCodeError('Código inválido. Verifique com o administrador.');
      return;
    }

    setLoading(true);
    setCodeError('');
    try {
      const { error } = await supabase
        .from('frota_veiculos')
        .update({
          status_seguro: 'segurado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', veiculo.id);

      if (error) throw error;

      toast.success(`Veículo ${veiculo.placa} marcado como Segurado`);
      handleOpenChange(false);
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar o status do veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Alteração de Status para Segurado</DialogTitle>
          <DialogDescription>
            Como deseja prosseguir com a alteração?
          </DialogDescription>
        </DialogHeader>

        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Veículo:</strong> {veiculo.placa}
            {veiculo.marca && veiculo.modelo && (
              <> — {veiculo.marca} {veiculo.modelo}</>
            )}
            <br />
            <strong>Status atual:</strong> {veiculo.status_seguro} → <strong>Segurado</strong>
          </AlertDescription>
        </Alert>

        {mode === 'choice' ? (
          <div className="space-y-3 pt-2">
            <button
              onClick={handleWaitApproval}
              disabled={loading}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
            >
              <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Aguardar aprovação do Admin</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A solicitação será enviada e ficará pendente até o administrador aprovar.
                </p>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-auto mt-0.5" />}
            </button>

            <button
              onClick={() => setMode('code')}
              disabled={loading}
              className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
            >
              <KeyRound className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Digitar código de aprovação</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Informe o código fornecido pelo administrador para aprovação imediata.
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="admin-code-single">Código de Aprovação</Label>
              <Input
                id="admin-code-single"
                placeholder="Ex: ADM#2026"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                className={codeError ? 'border-destructive' : ''}
                autoFocus
              />
              {codeError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {codeError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setMode('choice'); setCode(''); setCodeError(''); }}
                disabled={loading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleCodeSubmit}
                disabled={loading || !code.trim()}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aplicando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" />Confirmar</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
