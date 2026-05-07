import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HardHat, User, MapPin, Calendar, Plus, History, Clock, X, Trash2, StopCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssignmentRecord {
  id: string;
  vehicle_id: string;
  responsible_name: string;
  responsible_contact: string | null;
  worksite_name: string;
  worksite_code: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface VehicleAssignmentTabProps {
  vehicleId: string;
  currentResponsible?: string | null;
  currentResponsibleContact?: string | null;
  currentWorksite?: string | null;
  currentWorksiteStartDate?: string | null;
  mode?: 'view' | 'edit';
  onAssignmentSaved?: () => void;
}

export default function VehicleAssignmentTab({
  vehicleId,
  currentResponsible,
  currentResponsibleContact,
  currentWorksite,
  currentWorksiteStartDate,
  mode = 'view',
  onAssignmentSaved,
}: VehicleAssignmentTabProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<AssignmentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEndCurrent, setConfirmEndCurrent] = useState(false);
  const [endingCurrent, setEndingCurrent] = useState(false);

  // Local state for current assignment (updated optimistically after save)
  const [localResponsible, setLocalResponsible] = useState<string | null | undefined>(currentResponsible);
  const [localContact, setLocalContact] = useState<string | null | undefined>(currentResponsibleContact);
  const [localWorksite, setLocalWorksite] = useState<string | null | undefined>(currentWorksite);
  const [localStartDate, setLocalStartDate] = useState<string | null | undefined>(currentWorksiteStartDate);

  // Sync with props when they change (e.g., parent refetches)
  useEffect(() => { setLocalResponsible(currentResponsible); }, [currentResponsible]);
  useEffect(() => { setLocalContact(currentResponsibleContact); }, [currentResponsibleContact]);
  useEffect(() => { setLocalWorksite(currentWorksite); }, [currentWorksite]);
  useEffect(() => { setLocalStartDate(currentWorksiteStartDate); }, [currentWorksiteStartDate]);

  const [formData, setFormData] = useState({
    responsible_name: '',
    responsible_contact: '',
    worksite_name: '',
    worksite_code: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_assignment_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setHistory((data as AssignmentRecord[]) || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [vehicleId]);

  // Helper: retry network operations to mitigate transient "Failed to fetch" from preview proxy
  const withRetry = async <T,>(fn: () => PromiseLike<T>, attempts = 3, baseDelay = 400): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || err || '').toLowerCase();
        const isNetwork = msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
        if (!isNetwork || i === attempts - 1) throw err;
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
      }
    }
    throw lastErr;
  };

  const handleSave = async () => {
    const responsible = formData.responsible_name.trim();
    const worksite = formData.worksite_name.trim();
    const contact = formData.responsible_contact.trim();
    const code = formData.worksite_code.trim();
    const notes = formData.notes.trim();
    const startDate = formData.start_date;

    if (!responsible || !worksite || !startDate) {
      toast.error('Preencha os campos obrigatórios: Responsável, Obra e Data de início');
      return;
    }

    setSaving(true);
    try {
      // Get user from current session (no network call) — much faster than auth.getUser()
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      // Close any existing open assignment (with retry)
      const closeRes = await withRetry(() =>
        supabase
          .from('vehicle_assignment_history')
          .update({ end_date: startDate })
          .eq('vehicle_id', vehicleId)
          .is('end_date', null)
      );
      if (closeRes.error) throw closeRes.error;

      // Insert new assignment (with retry)
      const insertRes = await withRetry(() =>
        supabase
          .from('vehicle_assignment_history')
          .insert({
            vehicle_id: vehicleId,
            responsible_name: responsible,
            responsible_contact: contact || null,
            worksite_name: worksite,
            worksite_code: code || null,
            start_date: startDate,
            notes: notes || null,
            created_by: userId,
          })
      );
      if (insertRes.error) throw insertRes.error;

      // Update current assignment on vehicle (best-effort: don't block success)
      const hasInfo = !!(responsible && worksite);
      withRetry(() =>
        supabase
          .from('frota_veiculos')
          .update({
            current_responsible_name: responsible,
            current_responsible_contact: contact || null,
            current_worksite_name: worksite,
            current_worksite_start_date: startDate,
            has_assignment_info: hasInfo,
          })
          .eq('id', vehicleId)
      ).catch((err) => {
        console.warn('Falha ao atualizar veículo (não-crítico):', err);
      });

      // Optimistic UI update — reflect new assignment immediately without waiting for parent refetch
      setLocalResponsible(responsible);
      setLocalContact(contact || null);
      setLocalWorksite(worksite);
      setLocalStartDate(startDate);

      toast.success('Responsável e Obra atualizados com sucesso!');
      setEditOpen(false);
      onAssignmentSaved?.();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('failed to fetch')) {
        toast.error('Falha de conexão. Verifique sua internet e tente novamente. Se persistir no preview, teste na URL publicada.');
      } else {
        toast.error('Erro ao salvar: ' + (err.message || 'Tente novamente'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete a single assignment record from history
  const handleDelete = async (recordId: string) => {
    setDeleting(recordId);
    try {
      const target = history.find(h => h.id === recordId);
      const wasCurrent = target && !target.end_date;

      const { error } = await withRetry(() =>
        supabase.from('vehicle_assignment_history').delete().eq('id', recordId)
      );
      if (error) throw error;

      setHistory(prev => prev.filter(h => h.id !== recordId));

      if (wasCurrent) {
        setLocalResponsible(null);
        setLocalWorksite(null);
        setLocalStartDate(null);

        withRetry(() =>
          supabase
            .from('frota_veiculos')
            .update({
              current_responsible_name: null,
              current_worksite_name: null,
              current_worksite_start_date: null,
              has_assignment_info: false,
            })
            .eq('id', vehicleId)
        ).catch((e) => console.warn('Falha ao limpar veículo:', e));
      }

      toast.success('Alocação removida');
      onAssignmentSaved?.();
    } catch (err: any) {
      console.error('Erro ao deletar:', err);
      toast.error('Erro ao remover: ' + (err?.message || 'Tente novamente'));
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  // End the current assignment (sets end_date = today, clears current vehicle assignment)
  const handleEndCurrent = async () => {
    setEndingCurrent(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { error: closeErr } = await withRetry(() =>
        supabase
          .from('vehicle_assignment_history')
          .update({ end_date: today })
          .eq('vehicle_id', vehicleId)
          .is('end_date', null)
      );
      if (closeErr) throw closeErr;

      setLocalResponsible(null);
      setLocalWorksite(null);
      setLocalStartDate(null);

      withRetry(() =>
        supabase
          .from('frota_veiculos')
          .update({
            current_responsible_name: null,
            current_worksite_name: null,
            current_worksite_start_date: null,
            has_assignment_info: false,
          })
          .eq('id', vehicleId)
      ).catch((e) => console.warn('Falha ao limpar veículo:', e));

      toast.success('Alocação encerrada');
      onAssignmentSaved?.();
    } catch (err: any) {
      console.error('Erro ao encerrar:', err);
      toast.error('Erro ao encerrar: ' + (err?.message || 'Tente novamente'));
    } finally {
      setEndingCurrent(false);
      setConfirmEndCurrent(false);
    }
  };

  const openEdit = () => {
    setFormData({
      responsible_name: localResponsible || '',
      responsible_contact: localContact || '',
      worksite_name: localWorksite || '',
      worksite_code: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setEditOpen(true);
  };

  const openHistory = () => {
    loadHistory();
    setHistoryOpen(true);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    try {
      return format(new Date(d + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return d;
    }
  };

  return (
    <>
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <HardHat className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
            Responsável & Obra
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openHistory}>
              <History className="h-3.5 w-3.5 mr-1.5" />
              Histórico
            </Button>
            {(localResponsible || localWorksite) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEndCurrent(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <StopCircle className="h-3.5 w-3.5 mr-1.5" />
                Encerrar
              </Button>
            )}
            <Button size="sm" onClick={openEdit} className="bg-primary hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova Alocação
            </Button>
          </div>
        </div>

        {localResponsible || localWorksite ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Responsável Atual</p>
                <p className="font-semibold text-foreground">{localResponsible || '-'}</p>
                {localContact && (
                  <p className="text-xs text-muted-foreground mt-0.5">{localContact}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Obra Atual</p>
                <p className="font-semibold text-foreground">{localWorksite || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Desde</p>
                <p className="font-semibold text-foreground">{formatDate(localStartDate || null)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <HardHat className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Nenhuma alocação registrada</p>
            <Button variant="link" size="sm" className="mt-2" onClick={openEdit}>
              Registrar primeira alocação
            </Button>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-amber-600" />
              Nova Alocação — Responsável & Obra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável *</Label>
              <Input
                value={formData.responsible_name}
                onChange={(e) => setFormData(p => ({ ...p, responsible_name: e.target.value }))}
                placeholder="Nome do responsável pelo veículo"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contato do responsável</Label>
              <Input
                value={formData.responsible_contact}
                onChange={(e) => setFormData(p => ({ ...p, responsible_contact: e.target.value }))}
                placeholder="Telefone ou email (opcional)"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Obra responsável *</Label>
              <Input
                value={formData.worksite_name}
                onChange={(e) => setFormData(p => ({ ...p, worksite_name: e.target.value }))}
                placeholder="Nome da obra"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Código da obra</Label>
                <Input
                  value={formData.worksite_code}
                  onChange={(e) => setFormData(p => ({ ...p, worksite_code: e.target.value }))}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de início *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Observações sobre esta alocação"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Alocações
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhum registro no histórico</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record, index) => (
                  <div
                    key={record.id}
                    className={`relative pl-6 pb-4 ${index < history.length - 1 ? 'border-l-2 border-muted ml-2' : 'ml-2'}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                      !record.end_date 
                        ? 'bg-green-500 border-green-300' 
                        : 'bg-muted-foreground/30 border-muted'
                    }`} />

                    <div className="rounded-lg border p-3 bg-card">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={record.end_date ? 'secondary' : 'default'} className="text-xs">
                            {record.end_date ? 'Encerrado' : 'Atual'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(record.start_date)} — {record.end_date ? formatDate(record.end_date) : 'Presente'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => setConfirmDeleteId(record.id)}
                          disabled={deleting === record.id}
                          title="Excluir registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Responsável:</span>
                          <p className="font-medium">{record.responsible_name}</p>
                          {record.responsible_contact && (
                            <p className="text-xs text-muted-foreground">{record.responsible_contact}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Obra:</span>
                          <p className="font-medium">{record.worksite_name}</p>
                          {record.worksite_code && (
                            <p className="text-xs text-muted-foreground">Cód: {record.worksite_code}</p>
                          )}
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">📝 {record.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Record */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir alocação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o registro do histórico. Se for a alocação atual, o veículo ficará sem responsável e obra. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm End Current Assignment */}
      <AlertDialog open={confirmEndCurrent} onOpenChange={setConfirmEndCurrent}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar alocação atual?</AlertDialogTitle>
            <AlertDialogDescription>
              A alocação será marcada como encerrada hoje e o veículo ficará sem responsável e obra ativos. O histórico será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endingCurrent}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndCurrent}
              disabled={endingCurrent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {endingCurrent ? 'Encerrando...' : 'Encerrar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
