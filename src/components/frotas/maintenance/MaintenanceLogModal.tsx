import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceLog, MaintenanceType, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import { Save, ClipboardCheck, Wrench, CalendarCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  editingLog: MaintenanceLog | null;
  onSaved: () => void;
}

const REVISAO_TYPES: MaintenanceType[] = ['REVISAO', 'REVISAO_COMPLETA', 'PREVENTIVA', 'CORRETIVA'];
const MANUTENCAO_TYPES: MaintenanceType[] = ['TROCA_OLEO', 'TROCA_PNEUS', 'TROCA_FREIOS', 'TROCA_FILTROS', 'TROCA_BATERIA', 'BATERIA', 'PNEU', 'OUTRA'];

export default function MaintenanceLogModal({ open, onOpenChange, vehicleId, editingLog, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState('revisao');
  const [type, setType] = useState<MaintenanceType>('REVISAO');
  const [performedDate, setPerformedDate] = useState(new Date().toISOString().split('T')[0]);
  const [odometerKm, setOdometerKm] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [realizada, setRealizada] = useState(false);

  // Revisão-specific fields
  const [localRevisao, setLocalRevisao] = useState('');
  const [proximaRevisaoData, setProximaRevisaoData] = useState('');
  const [proximaRevisaoKm, setProximaRevisaoKm] = useState('');
  const [itensVerificados, setItensVerificados] = useState('');

  // Manutenção-specific fields
  const [pecaSubstituida, setPecaSubstituida] = useState('');
  const [garantiaMeses, setGarantiaMeses] = useState('');
  const [prestadorServico, setPrestadorServico] = useState('');

  useEffect(() => {
    if (editingLog) {
      setType(editingLog.type);
      setModalTab(REVISAO_TYPES.includes(editingLog.type) ? 'revisao' : 'manutencao');
      setPerformedDate(editingLog.performed_date);
      setOdometerKm(String(editingLog.odometer_km));
      setCost(String(editingLog.cost));
      setNotes(editingLog.notes || '');
      setRealizada(editingLog.realizada ?? false);
      // Parse extra fields from notes JSON if available
      try {
        const extra = editingLog.notes ? JSON.parse(editingLog.notes) : null;
        if (extra && typeof extra === 'object' && extra._extra) {
          setLocalRevisao(extra.local_revisao || '');
          setProximaRevisaoData(extra.proxima_revisao_data || '');
          setProximaRevisaoKm(extra.proxima_revisao_km || '');
          setItensVerificados(extra.itens_verificados || '');
          setPecaSubstituida(extra.peca_substituida || '');
          setGarantiaMeses(extra.garantia_meses || '');
          setPrestadorServico(extra.prestador_servico || '');
          setNotes(extra.observacoes || '');
        } else {
          resetExtraFields();
        }
      } catch {
        resetExtraFields();
      }
    } else {
      setType('REVISAO');
      setModalTab('revisao');
      setPerformedDate(new Date().toISOString().split('T')[0]);
      setOdometerKm('');
      setCost('');
      setNotes('');
      setRealizada(false);
      resetExtraFields();
    }
  }, [editingLog, open]);

  const resetExtraFields = () => {
    setLocalRevisao('');
    setProximaRevisaoData('');
    setProximaRevisaoKm('');
    setItensVerificados('');
    setPecaSubstituida('');
    setGarantiaMeses('');
    setPrestadorServico('');
  };

  const handleTabChange = (tab: string) => {
    setModalTab(tab);
    if (tab === 'revisao') setType('REVISAO');
    else setType('TROCA_OLEO');
    resetExtraFields();
  };

  const currentTypes = modalTab === 'revisao' ? REVISAO_TYPES : MANUTENCAO_TYPES;
  const isRevisao = modalTab === 'revisao';

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

    // Pack extra fields into notes as JSON
    const extraData = {
      _extra: true,
      observacoes: notes,
      ...(isRevisao ? {
        local_revisao: localRevisao,
        proxima_revisao_data: proximaRevisaoData,
        proxima_revisao_km: proximaRevisaoKm,
        itens_verificados: itensVerificados,
      } : {
        peca_substituida: pecaSubstituida,
        garantia_meses: garantiaMeses,
        prestador_servico: prestadorServico,
      }),
    };

    setSaving(true);
    const payload = {
      vehicle_id: vehicleId,
      type,
      performed_date: performedDate,
      odometer_km: km,
      cost: costVal,
      notes: JSON.stringify(extraData),
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
      toast({
        title: editingLog ? 'Registro atualizado!' : 'Registro criado!',
        description: `${MAINTENANCE_TYPE_ICONS[type]} ${MAINTENANCE_TYPE_LABELS[type]} — ${realizada ? 'Concluído' : 'Agendado'}`,
      });
      onOpenChange(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRevisao ? <ClipboardCheck className="h-5 w-5 text-primary" /> : <Wrench className="h-5 w-5 text-primary" />}
            {editingLog ? 'Editar Registro' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tab selector */}
          <Tabs value={modalTab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="revisao" className="flex-1 gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Revisão
              </TabsTrigger>
              <TabsTrigger value="manutencao" className="flex-1 gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Manutenção
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={(v) => setType(v as MaintenanceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentTypes.map(t => (
                  <SelectItem key={t} value={t}>{MAINTENANCE_TYPE_ICONS[t]} {MAINTENANCE_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Common fields: Data, KM, Custo */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* ===== REVISÃO-SPECIFIC FIELDS ===== */}
          {isRevisao && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Dados da Revisão
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Local / Oficina</Label>
                <Input placeholder="Ex: Concessionária Toyota Centro" value={localRevisao} onChange={e => setLocalRevisao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Próxima revisão (data)</Label>
                  <Input type="date" value={proximaRevisaoData} onChange={e => setProximaRevisaoData(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Próxima revisão (KM)</Label>
                  <Input type="number" min="0" placeholder="Ex: 55000" value={proximaRevisaoKm} onChange={e => setProximaRevisaoKm(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Itens verificados / Serviços</Label>
                <Textarea rows={2} placeholder="Ex: Óleo, filtros, freios, correia dentada..." value={itensVerificados} onChange={e => setItensVerificados(e.target.value)} className="resize-none text-sm" />
              </div>
            </div>
          )}

          {/* ===== MANUTENÇÃO-SPECIFIC FIELDS ===== */}
          {!isRevisao && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Dados da Manutenção
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Peça / Componente substituído</Label>
                <Input placeholder="Ex: Pneu Michelin 205/55R16" value={pecaSubstituida} onChange={e => setPecaSubstituida(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Garantia (meses)</Label>
                  <Input type="number" min="0" placeholder="Ex: 12" value={garantiaMeses} onChange={e => setGarantiaMeses(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Prestador de serviço</Label>
                  <Input placeholder="Ex: Auto Center Silva" value={prestadorServico} onChange={e => setPrestadorServico(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Status toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Switch checked={realizada} onCheckedChange={setRealizada} />
            <div className="flex-1">
              <Label className="text-sm font-medium cursor-pointer" onClick={() => setRealizada(!realizada)}>
                {isRevisao ? 'Revisão realizada' : 'Manutenção realizada'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {realizada ? '✅ Concluído' : '⏳ Agendado / Pendente'}
              </p>
            </div>
            <Badge variant={realizada ? 'default' : 'secondary'} className={`text-[10px] ${realizada ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500/80 hover:bg-amber-500 text-white'}`}>
              {realizada ? 'Concluído' : 'Pendente'}
            </Badge>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} placeholder="Detalhes adicionais..." value={notes} onChange={e => setNotes(e.target.value)} className="resize-none" />
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
