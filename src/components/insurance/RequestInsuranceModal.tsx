import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const success = await onSubmit({
        veiculo_id: veiculo.id,
        empresa_id: empresaId,
        current_status: veiculo.status_seguro,
        requested_status: 'segurado',
        motivo: motivo.trim() || undefined,
      });

      if (success) {
        setMotivo('');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Mudança de Status</DialogTitle>
          <DialogDescription>
            Envie uma solicitação ao administrador para marcar este veículo como "Segurado".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Veículo:</strong> {veiculo.placa}
              {veiculo.marca && veiculo.modelo && (
                <> - {veiculo.marca} {veiculo.modelo}</>
              )}
              <br />
              <strong>Status atual:</strong> {veiculo.status_seguro}
              <br />
              <strong>Status solicitado:</strong> Segurado
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da solicitação..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
