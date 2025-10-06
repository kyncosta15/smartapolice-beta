import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { InsuranceApprovalRequest } from '@/hooks/useInsuranceApprovals';

interface DecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InsuranceApprovalRequest;
  type: 'approve' | 'reject';
  onConfirm: (note?: string) => Promise<void>;
}

export function DecisionModal({
  open,
  onOpenChange,
  request,
  type,
  onConfirm,
}: DecisionModalProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(note.trim() || undefined);
      setNote('');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isApprove = type === 'approve';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Aprovar Solicitação
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Rejeitar Solicitação
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? 'O status do veículo será atualizado para "Segurado".'
              : 'A solicitação será rejeitada e o veículo manterá o status atual.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Veículo:</span>{' '}
              <span className="font-medium">{request.frota_veiculos?.placa}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Empresa:</span>{' '}
              <span className="font-medium">{request.empresas?.nome}</span>
            </div>
            {request.motivo && (
              <div>
                <span className="text-muted-foreground">Motivo da solicitação:</span>
                <p className="mt-1 text-foreground">{request.motivo}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="decision-note">
              Nota da Decisão {!isApprove && '(recomendado)'}
            </Label>
            <Textarea
              id="decision-note"
              placeholder={
                isApprove
                  ? 'Adicione uma nota sobre a aprovação (opcional)...'
                  : 'Explique o motivo da rejeição...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={isApprove ? 'default' : 'destructive'}
          >
            {loading ? 'Processando...' : isApprove ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
