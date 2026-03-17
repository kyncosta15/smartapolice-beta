import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceRule, MaintenanceType, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import { Save } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  rules: MaintenanceRule[];
  onSaved: () => void;
}

interface RuleForm {
  due_every_km: string;
  due_every_months: string;
  alert_before_km: string;
  alert_before_days: string;
}

const TYPES: MaintenanceType[] = ['REVISAO', 'PNEU', 'BATERIA'];

const emptyForm = (): RuleForm => ({
  due_every_km: '',
  due_every_months: '',
  alert_before_km: '500',
  alert_before_days: '15',
});

export default function MaintenanceRulesModal({ open, onOpenChange, vehicleId, rules, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<Record<MaintenanceType, RuleForm>>({
    REVISAO: emptyForm(),
    PNEU: emptyForm(),
    BATERIA: emptyForm(),
  });

  useEffect(() => {
    const newForms: Record<MaintenanceType, RuleForm> = {
      REVISAO: emptyForm(),
      PNEU: emptyForm(),
      BATERIA: emptyForm(),
    };
    rules.forEach(r => {
      if (r.type in newForms) {
        newForms[r.type as MaintenanceType] = {
          due_every_km: r.due_every_km ? String(r.due_every_km) : '',
          due_every_months: r.due_every_months ? String(r.due_every_months) : '',
          alert_before_km: r.alert_before_km !== null ? String(r.alert_before_km) : '500',
          alert_before_days: r.alert_before_days !== null ? String(r.alert_before_days) : '15',
        };
      }
    });
    setForms(newForms);
  }, [rules, open]);

  const updateForm = (type: MaintenanceType, field: keyof RuleForm, value: string) => {
    setForms(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const upserts = TYPES.map(type => {
      const f = forms[type];
      const dueKm = f.due_every_km ? parseInt(f.due_every_km) : null;
      const dueMonths = f.due_every_months ? parseInt(f.due_every_months) : null;

      // Skip if no rules defined
      if (!dueKm && !dueMonths) return null;

      return {
        vehicle_id: vehicleId,
        type,
        due_every_km: dueKm,
        due_every_months: dueMonths,
        alert_before_km: f.alert_before_km ? parseInt(f.alert_before_km) : 500,
        alert_before_days: f.alert_before_days ? parseInt(f.alert_before_days) : 15,
      };
    }).filter(Boolean);

    // Delete existing rules for this vehicle and re-insert
    const { error: delError } = await supabase
      .from('vehicle_maintenance_rules')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (delError) {
      toast({ title: 'Erro ao salvar regras', description: delError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    if (upserts.length > 0) {
      const { error } = await supabase
        .from('vehicle_maintenance_rules')
        .insert(upserts as any[]);

      if (error) {
        toast({ title: 'Erro ao salvar regras', description: error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }
    }

    toast({ title: 'Regras salvas com sucesso!' });
    onOpenChange(false);
    onSaved();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Regras de Manutenção</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {TYPES.map(type => (
            <div key={type} className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-1.5">
                {MAINTENANCE_TYPE_ICONS[type]} {MAINTENANCE_TYPE_LABELS[type]}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">A cada X km</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 10000"
                    value={forms[type].due_every_km}
                    onChange={e => updateForm(type, 'due_every_km', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">A cada X meses</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ex: 6"
                    value={forms[type].due_every_months}
                    onChange={e => updateForm(type, 'due_every_months', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alertar X km antes</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={forms[type].alert_before_km}
                    onChange={e => updateForm(type, 'alert_before_km', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Alertar X dias antes</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="15"
                    value={forms[type].alert_before_days}
                    onChange={e => updateForm(type, 'alert_before_days', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Salvando...' : 'Salvar Regras'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
