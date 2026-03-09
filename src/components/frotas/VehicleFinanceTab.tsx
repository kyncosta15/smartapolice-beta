import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Landmark,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Save,
  Plus,
  Trash2,
  Camera
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleFinance {
  id?: string;
  vehicle_id: string;
  empresa_id: string;
  type: string;
  bank_name: string;
  direct_payment: boolean;
  status: string;
  start_date: string;
  end_date: string;
  term_months: number;
  installment_value: number;
  installments_paid: number;
  down_payment: number;
  notes: string;
}

interface FipeSnapshot {
  id: string;
  fipe_value: number;
  reference_month: string;
  created_at: string;
}

interface VehicleFinanceTabProps {
  vehicleId: string;
  empresaId: string;
  fipeAtual?: number;
  mode?: 'view' | 'edit';
}

const emptyFinance = (vehicleId: string, empresaId: string): VehicleFinance => ({
  vehicle_id: vehicleId,
  empresa_id: empresaId,
  type: 'FINANCIAMENTO',
  bank_name: '',
  direct_payment: false,
  status: 'EM_ANDAMENTO',
  start_date: '',
  end_date: '',
  term_months: 12,
  installment_value: 0,
  installments_paid: 0,
  down_payment: 0,
  notes: '',
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function VehicleFinanceTab({ vehicleId, empresaId, fipeAtual }: VehicleFinanceTabProps) {
  const [finance, setFinance] = useState<VehicleFinance | null>(null);
  const [hasRecord, setHasRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [snapshots, setSnapshots] = useState<FipeSnapshot[]>([]);

  useEffect(() => {
    loadFinance();
    loadSnapshots();
  }, [vehicleId]);

  const loadFinance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_finance')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFinance({
          id: data.id,
          vehicle_id: data.vehicle_id,
          empresa_id: data.empresa_id,
          type: data.type,
          bank_name: data.bank_name || '',
          direct_payment: data.direct_payment,
          status: data.status,
          start_date: data.start_date || '',
          term_months: data.term_months,
          installment_value: Number(data.installment_value),
          installments_paid: data.installments_paid,
          down_payment: Number(data.down_payment || 0),
          end_date: data.end_date || '',
          notes: data.notes || '',
        });
        setHasRecord(true);
        setShowForm(true);
      } else {
        setHasRecord(false);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSnapshots = async () => {
    try {
      const { data } = await supabase
        .from('vehicle_fipe_snapshots')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('reference_month', { ascending: false })
        .limit(12);

      setSnapshots((data || []) as FipeSnapshot[]);
    } catch (err) {
      console.error('Erro ao carregar snapshots FIPE:', err);
    }
  };

  const handleSave = async () => {
    if (!finance) return;
    setSaving(true);
    try {
      // Auto-set status
      const autoStatus = finance.installments_paid >= finance.term_months ? 'QUITADO' : finance.status;
      const payload = { ...finance, status: autoStatus };

      if (hasRecord && finance.id) {
        const { error } = await supabase
          .from('vehicle_finance')
          .update(payload)
          .eq('id', finance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicle_finance')
          .insert(payload);
        if (error) throw error;
      }

      toast.success('Dados financeiros salvos!');
      await loadFinance();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!finance?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vehicle_finance')
        .delete()
        .eq('id', finance.id);
      if (error) throw error;
      toast.success('Dados financeiros removidos');
      setFinance(null);
      setHasRecord(false);
      setShowForm(false);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkQuitado = async () => {
    if (!finance) return;
    setFinance(prev => prev ? { ...prev, status: 'QUITADO', installments_paid: prev.term_months } : prev);
  };

  const handleGenerateSnapshot = async () => {
    if (!fipeAtual) {
      toast.error('Valor FIPE atual não disponível');
      return;
    }
    try {
      const now = new Date();
      const refMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { error } = await supabase
        .from('vehicle_fipe_snapshots')
        .upsert({
          vehicle_id: vehicleId,
          fipe_value: fipeAtual,
          reference_month: refMonth,
        }, { onConflict: 'vehicle_id,reference_month' });

      if (error) throw error;
      toast.success('Snapshot FIPE registrado!');
      await loadSnapshots();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const updateField = (field: keyof VehicleFinance, value: any) => {
    setFinance(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // Computed values
  const remainingMonths = finance ? Math.max(finance.term_months - finance.installments_paid, 0) : 0;
  const totalEstimated = finance ? finance.term_months * finance.installment_value : 0;
  const remainingBalance = finance ? remainingMonths * finance.installment_value : 0;
  const isQuitado = finance?.status === 'QUITADO' || (finance && finance.installments_paid >= finance.term_months);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Landmark className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Sem dados financeiros registrados</p>
        <Button onClick={() => {
          setFinance(emptyFinance(vehicleId, empresaId));
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Financeiro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      {finance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              {isQuitado ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-amber-600" />
              )}
              <span className="text-xs text-muted-foreground font-medium">Status</span>
            </div>
            <Badge className={isQuitado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {isQuitado ? 'Quitado' : 'Em andamento'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {finance.type === 'CONSORCIO' ? 'Consórcio' : 'Financiamento'} • {finance.bank_name || 'N/A'}
            </p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Parcela Mensal</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(finance.installment_value)}</p>
            <p className="text-xs text-muted-foreground">
              {finance.installments_paid}/{finance.term_months} pagas • {remainingMonths} restantes
            </p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground font-medium">Total Estimado</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalEstimated)}</p>
            <p className="text-xs text-muted-foreground">
              Saldo: {formatCurrency(remainingBalance)}
            </p>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground font-medium">FIPE Atual</span>
            </div>
            <p className="text-lg font-bold">{fipeAtual ? formatCurrency(fipeAtual) : 'N/D'}</p>
            {fipeAtual && finance.installment_value > 0 && (
              <p className="text-xs text-muted-foreground">
                Ratio: {((finance.installment_value / fipeAtual) * 100).toFixed(2)}%
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Form */}
      {finance && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              {hasRecord ? 'Editar Dados Financeiros' : 'Registrar Dados Financeiros'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Tipo</Label>
                <Select
                  value={finance.type}
                  onValueChange={(v) => updateField('type', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINANCIAMENTO">Financiamento</SelectItem>
                    <SelectItem value="CONSORCIO">Consórcio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Banco / Instituição</Label>
                <Input
                  value={finance.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="Ex: Itaú, Bradesco..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <Select
                  value={finance.status}
                  onValueChange={(v) => updateField('status', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                    <SelectItem value="QUITADO">Quitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Prazo Total (meses)</Label>
                <Input
                  type="number"
                  min={1}
                  value={finance.term_months}
                  onChange={(e) => updateField('term_months', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Valor da Parcela (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={finance.installment_value}
                  onChange={(e) => updateField('installment_value', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Parcelas Pagas</Label>
                <Input
                  type="number"
                  min={0}
                  max={finance.term_months}
                  value={finance.installments_paid}
                  onChange={(e) => updateField('installments_paid', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Entrada (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={finance.down_payment}
                  onChange={(e) => updateField('down_payment', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data Início</Label>
                <Input
                  type="date"
                  value={finance.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={finance.direct_payment}
                  onCheckedChange={(v) => updateField('direct_payment', v)}
                />
                <Label className="text-sm">Pagamento Direto</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Observações</Label>
              <Textarea
                value={finance.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
                placeholder="Notas adicionais..."
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              {!isQuitado && (
                <Button variant="outline" onClick={handleMarkQuitado}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Quitado
                </Button>
              )}
              <Button variant="outline" onClick={handleGenerateSnapshot} disabled={!fipeAtual}>
                <Camera className="h-4 w-4 mr-2" />
                Snapshot FIPE
              </Button>
              {hasRecord && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FIPE Snapshots History */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico FIPE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {snapshots.map((s) => (
                <div key={s.id} className="p-2 bg-muted rounded-md text-center">
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.reference_month + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(s.fipe_value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
