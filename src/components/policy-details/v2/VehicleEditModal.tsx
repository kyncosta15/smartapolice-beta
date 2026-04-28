import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Car } from 'lucide-react';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  policy: any;
  onSaved?: () => void;
}

export const VehicleEditModal: React.FC<Props> = ({ open, onClose, policy, onSaved }) => {
  const { updatePolicy } = usePersistedPolicies();
  const [saving, setSaving] = useState(false);

  const normalizedType =
    policy?.type?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const isNautico = normalizedType === 'nautico';

  const [form, setForm] = useState({
    marca: policy?.marca || '',
    vehicleModel: policy?.vehicleModel || policy?.modelo_veiculo || '',
    ano_modelo: policy?.ano_modelo || '',
    placa: policy?.placa || '',
    nome_embarcacao: policy?.nome_embarcacao || '',
    franquia: policy?.deductible ?? policy?.franquia ?? 0,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        marca: form.marca,
        vehicleModel: form.vehicleModel,
        ano_modelo: form.ano_modelo,
        franquia: parseFloat(String(form.franquia)) || 0,
      };
      if (!isNautico) updates.placa = form.placa;
      if (isNautico) updates.nome_embarcacao = form.nome_embarcacao;

      const success = await updatePolicy(policy.id, updates);
      if (success) {
        toast({
          title: '✅ Veículo atualizado',
          description: 'Dados do veículo salvos com sucesso.',
        });
        onSaved?.();
        onClose();
      } else {
        throw new Error('Falha ao salvar');
      }
    } catch {
      toast({
        title: '❌ Erro',
        description: 'Não foi possível salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Car className="h-5 w-5 text-primary" />
            {isNautico ? 'Editar Embarcação' : 'Editar Veículo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Marca</Label>
            <Input
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
              placeholder="Ex: Toyota"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Modelo</Label>
            <Input
              value={form.vehicleModel}
              onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value }))}
              placeholder="Ex: Corolla"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ano Modelo</Label>
            <Input
              value={form.ano_modelo}
              onChange={(e) => setForm((f) => ({ ...f, ano_modelo: e.target.value }))}
              placeholder="Ex: 2024"
            />
          </div>
          {!isNautico && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Placa</Label>
              <Input
                value={form.placa}
                onChange={(e) =>
                  setForm((f) => ({ ...f, placa: e.target.value.toUpperCase() }))
                }
                placeholder="Ex: ABC1D23"
                maxLength={10}
                className="font-mono"
              />
            </div>
          )}
          {isNautico && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome da Embarcação</Label>
              <Input
                value={form.nome_embarcacao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome_embarcacao: e.target.value }))
                }
                placeholder="Nome da embarcação"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Franquia (R$)</Label>
            <Input
              type="number"
              value={form.franquia}
              onChange={(e) => setForm((f) => ({ ...f, franquia: e.target.value as any }))}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
