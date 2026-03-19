import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addYears, format } from 'date-fns';
import { TachographInspection } from './useTachographData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  editingInspection: TachographInspection | null;
  onSaved: () => void;
}

export default function TachographInspectionModal({ open, onOpenChange, vehicleId, editingInspection, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [inspectionDate, setInspectionDate] = useState('');
  const [providerName, setProviderName] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingInspection) {
      setInspectionDate(editingInspection.inspection_date);
      setProviderName(editingInspection.provider_name || '');
      setCertificateNumber(editingInspection.certificate_number || '');
      setCost(String(editingInspection.cost));
      setNotes(editingInspection.notes || '');
    } else {
      setInspectionDate(format(new Date(), 'yyyy-MM-dd'));
      setProviderName('');
      setCertificateNumber('');
      setCost('0');
      setNotes('');
    }
  }, [editingInspection, open]);

  const handleSave = async () => {
    if (!inspectionDate) {
      toast({ title: 'Data da vistoria é obrigatória', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const validUntil = format(addYears(new Date(inspectionDate + 'T00:00:00'), 2), 'yyyy-MM-dd');

    const payload = {
      vehicle_id: vehicleId,
      inspection_date: inspectionDate,
      valid_until: validUntil,
      provider_name: providerName || null,
      certificate_number: certificateNumber || null,
      cost: parseFloat(cost) || 0,
      notes: notes || null,
    };

    let error;
    if (editingInspection) {
      ({ error } = await supabase.from('truck_tachograph_inspections').update(payload).eq('id', editingInspection.id));
    } else {
      ({ error } = await supabase.from('truck_tachograph_inspections').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingInspection ? 'Vistoria atualizada' : 'Vistoria registrada' });
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingInspection ? 'Editar Vistoria' : 'Nova Vistoria do Tacógrafo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Data da Vistoria *</Label>
            <Input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
          </div>

          {inspectionDate && (
            <div className="p-3 rounded-lg bg-muted/50 border text-sm">
              <span className="text-muted-foreground">Validade automática: </span>
              <span className="font-semibold">
                {format(addYears(new Date(inspectionDate + 'T00:00:00'), 2), 'dd/MM/yyyy')}
              </span>
              <span className="text-muted-foreground"> (2 anos)</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Empresa / Oficina</Label>
            <Input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="Nome do fornecedor" />
          </div>

          <div className="space-y-2">
            <Label>Nº Certificado / Laudo</Label>
            <Input value={certificateNumber} onChange={e => setCertificateNumber(e.target.value)} placeholder="Ex: CERT-2025-001" />
          </div>

          <div className="space-y-2">
            <Label>Custo (R$)</Label>
            <Input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas adicionais..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
