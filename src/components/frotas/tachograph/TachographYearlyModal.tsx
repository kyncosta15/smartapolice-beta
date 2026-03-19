import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TachographYearlyRecord } from './useTachographData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  editingRecord: TachographYearlyRecord | null;
  onSaved: () => void;
}

export default function TachographYearlyModal({ open, onOpenChange, vehicleId, editingRecord, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState('');
  const [kmStart, setKmStart] = useState('');
  const [kmEnd, setKmEnd] = useState('');
  const [incidents, setIncidents] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingRecord) {
      setYear(editingRecord.year);
      setSummary(editingRecord.summary || '');
      setKmStart(editingRecord.km_start != null ? String(editingRecord.km_start) : '');
      setKmEnd(editingRecord.km_end != null ? String(editingRecord.km_end) : '');
      setIncidents(editingRecord.incidents || '');
      setNotes(editingRecord.notes || '');
    } else {
      setYear(new Date().getFullYear());
      setSummary('');
      setKmStart('');
      setKmEnd('');
      setIncidents('');
      setNotes('');
    }
  }, [editingRecord, open]);

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      vehicle_id: vehicleId,
      year,
      summary: summary || null,
      km_start: kmStart ? parseInt(kmStart) : null,
      km_end: kmEnd ? parseInt(kmEnd) : null,
      incidents: incidents || null,
      notes: notes || null,
    };

    let error;
    if (editingRecord) {
      ({ error } = await supabase.from('truck_tachograph_yearly_records').update(payload).eq('id', editingRecord.id));
    } else {
      ({ error } = await supabase.from('truck_tachograph_yearly_records').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingRecord ? 'Registro atualizado' : 'Registro anual criado' });
      onSaved();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingRecord ? 'Editar Registro Anual' : 'Novo Registro Anual'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ano de Referência *</Label>
            <Input type="number" min="2000" max="2100" value={year} onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())} disabled={!!editingRecord} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>KM Início</Label>
              <Input type="number" min="0" value={kmStart} onChange={e => setKmStart(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>KM Fim</Label>
              <Input type="number" min="0" value={kmEnd} onChange={e => setKmEnd(e.target.value)} placeholder="0" />
            </div>
          </div>

          {kmStart && kmEnd && parseInt(kmEnd) > parseInt(kmStart) && (
            <div className="p-2 rounded bg-muted/50 text-sm text-muted-foreground">
              Total percorrido: <span className="font-semibold text-foreground">{(parseInt(kmEnd) - parseInt(kmStart)).toLocaleString('pt-BR')} km</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Resumo do Ano</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="Resumo geral do ano..." />
          </div>

          <div className="space-y-2">
            <Label>Ocorrências</Label>
            <Textarea value={incidents} onChange={e => setIncidents(e.target.value)} rows={2} placeholder="Ocorrências relevantes..." />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notas adicionais..." />
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
