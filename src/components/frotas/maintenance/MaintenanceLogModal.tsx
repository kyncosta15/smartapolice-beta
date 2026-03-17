import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceLog, MaintenanceType, ALL_MAINTENANCE_TYPES, MAINTENANCE_TYPE_LABELS } from './types';
import { Save } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  editingLog: MaintenanceLog | null;
  onSaved: () => void;
}

export default function MaintenanceLogModal({ open, onOpenChange, vehicleId, editingLog, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<MaintenanceType>('REVISAO');
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [realizada, setRealizada] = useState(false);

  useEffect(() => {
    if (editingLog) {
      setType(editingLog.type);
      setPerformedDate(editingLog.performed_date);
      setOdometerKm(String(editingLog.odometer_km));
      setCost(String(editingLog.cost));
      setNotes(editingLog.notes || '');
      setRealizada(editingLog.realizada ?? false);
    } else {
      setType('REVISAO');
      setPerformedDate(new Date().toISOString().split('T')[0]);
      setOdometerKm('');
      setCost('');
      setNotes('');
      setRealizada(false);
    }
  }, [editingLog, open]);

  const handleSave = async () => {
    if (!type || !performedDate || !odometerKm) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const km = parseInt(odometerKm);
    const costVal = parseFloat(cost || '0');

    if (km < 0) {
      toast({ title: 'KM deve ser >= 0', variant: 'destructive' });
      return;
    }
    if (costVal < 0) {
      toast({ title: 'Custo deve ser >= 0', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      vehicle_id: vehicleId,
      type,
      performed_date: performedDate,
      odometer_km: km,
      cost: costVal,
      notes: notes || null,
      realizada,
    };

    let error;
    if (editingLog) {
      ({ error } = await supabase.from('vehicle_maintenance_logs').update(payload).eq('id', editingLog.id));
    } else {
      ({ error } = await supabase.from('vehicle_maintenance_logs').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingLog ? 'Registro atualizado!' : 'Registro criado!' });
      onOpenChange(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingLog ? 'Editar Manutenção' : 'Novo Registro de Manutenção'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as MaintenanceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_MAINTENANCE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{MAINTENANCE_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={performedDate} onChange={e => setPerformedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>KM Atual *</Label>
              <Input type="number" min="0" placeholder="Ex: 45000" value={odometerKm} onChange={e => setOdometerKm(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custo (R$)</Label>
            <Input type="number" min="0" step="0.01" placeholder="Ex: 350.00" value={cost} onChange={e => setCost(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={realizada} onCheckedChange={setRealizada} />
            <Label className="text-sm font-medium cursor-pointer" onClick={() => setRealizada(!realizada)}>
              Manutenção realizada
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={3} placeholder="Detalhes..." value={notes} onChange={e => setNotes(e.target.value)} className="resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
