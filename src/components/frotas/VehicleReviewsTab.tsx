import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Plus, Save, Trash2, Wrench, CalendarDays, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currencyFormatter';

interface VehicleReview {
  id?: string;
  vehicle_id: string;
  empresa_id: string;
  tipo: string;
  data_revisao: string;
  km_atual: number | null;
  valor: number | null;
  realizada: boolean;
  observacoes: string;
}

interface VehicleReviewsTabProps {
  vehicleId: string;
  empresaId: string;
}

const emptyReview = (vehicleId: string, empresaId: string): VehicleReview => ({
  vehicle_id: vehicleId,
  empresa_id: empresaId,
  tipo: 'basica',
  data_revisao: new Date().toISOString().split('T')[0],
  km_atual: null,
  valor: null,
  realizada: false,
  observacoes: '',
});

export default function VehicleReviewsTab({ vehicleId, empresaId }: VehicleReviewsTabProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<VehicleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<VehicleReview | null>(null);

  const fetchReviews = useCallback(async (signal?: AbortSignal) => {
    const { data, error } = await supabase
      .from('vehicle_reviews')
      .select('id, vehicle_id, empresa_id, tipo, data_revisao, km_atual, valor, realizada, observacoes')
      .eq('vehicle_id', vehicleId)
      .order('data_revisao', { ascending: false })
      .limit(50);

    if (signal?.aborted) return;

    if (error) {
      console.error('Erro ao buscar revisões:', error);
    } else {
      setReviews((data || []).map((r: any) => ({
        id: r.id,
        vehicle_id: r.vehicle_id,
        empresa_id: r.empresa_id,
        tipo: r.tipo || 'basica',
        data_revisao: r.data_revisao || '',
        km_atual: r.km_atual,
        valor: r.valor,
        realizada: r.realizada ?? false,
        observacoes: r.observacoes || '',
      })));
    }
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchReviews(controller.signal);
    return () => controller.abort();
  }, [fetchReviews]);

  const handleSave = async () => {
    if (!editingReview) return;
    setSaving(true);

    const payload = {
      vehicle_id: editingReview.vehicle_id,
      empresa_id: editingReview.empresa_id,
      tipo: editingReview.tipo,
      data_revisao: editingReview.data_revisao,
      km_atual: editingReview.km_atual,
      valor: editingReview.valor,
      realizada: editingReview.realizada,
      observacoes: editingReview.observacoes || null,
    };

    let error;
    if (editingReview.id) {
      ({ error } = await supabase
        .from('vehicle_reviews')
        .update(payload)
        .eq('id', editingReview.id));
    } else {
      ({ error } = await supabase
        .from('vehicle_reviews')
        .insert(payload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar revisão', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Revisão salva com sucesso!' });
      setShowForm(false);
      setEditingReview(null);
      fetchReviews();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vehicle_reviews').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Revisão excluída' });
      fetchReviews();
    }
  };

  const openNew = () => {
    setEditingReview(emptyReview(vehicleId, empresaId));
    setShowForm(true);
  };

  const openEdit = (r: VehicleReview) => {
    setEditingReview({ ...r });
    setShowForm(true);
  };

  const updateField = (field: keyof VehicleReview, value: any) => {
    if (!editingReview) return;
    setEditingReview({ ...editingReview, [field]: value });
  };

  if (loading) {
    return <div className="text-center py-6 text-muted-foreground text-sm">Carregando revisões...</div>;
  }

  return (
    <Card className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          Revisões e Acompanhamento
        </h3>
        {!showForm && (
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Revisão
          </Button>
        )}
      </div>

      {showForm && editingReview && (
        <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
          <h4 className="font-medium text-sm">{editingReview.id ? 'Editar Revisão' : 'Nova Revisão'}</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editingReview.tipo}
                onChange={(e) => updateField('tipo', e.target.value)}
              >
                <option value="basica">Revisão Básica</option>
                <option value="completa">Revisão Completa</option>
                <option value="preventiva">Preventiva</option>
                <option value="corretiva">Corretiva</option>
                <option value="troca_oleo">Troca de Óleo</option>
                <option value="troca_pneus">Troca de Pneus</option>
                <option value="troca_freios">Troca de Freios</option>
                <option value="troca_filtros">Troca de Filtros</option>
                <option value="troca_bateria">Troca de Bateria</option>
                <option value="outra">Outra</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Data da Revisão</Label>
              <Input
                type="date"
                value={editingReview.data_revisao}
                onChange={(e) => updateField('data_revisao', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">KM Atual</Label>
              <Input
                type="number"
                placeholder="Ex: 45000"
                value={editingReview.km_atual ?? ''}
                onChange={(e) => updateField('km_atual', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 350.00"
                value={editingReview.valor ?? ''}
                onChange={(e) => updateField('valor', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={editingReview.realizada}
              onCheckedChange={(v) => updateField('realizada', v)}
            />
            <Label className="text-sm font-medium">Revisão realizada</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações</Label>
            <Textarea
              rows={3}
              placeholder="Detalhes sobre a revisão..."
              value={editingReview.observacoes}
              onChange={(e) => updateField('observacoes', e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingReview(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma revisão registrada</p>
          <p className="text-xs mt-1">Clique em "Nova Revisão" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => openEdit(r)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${r.realizada ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {r.realizada ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {r.tipo === 'basica' ? 'Revisão Básica' :
                     r.tipo === 'completa' ? 'Revisão Completa' :
                     r.tipo === 'preventiva' ? 'Preventiva' :
                     r.tipo === 'corretiva' ? 'Corretiva' :
                     r.tipo === 'troca_oleo' ? 'Troca de Óleo' :
                     r.tipo === 'troca_pneus' ? 'Troca de Pneus' :
                     r.tipo === 'troca_freios' ? 'Troca de Freios' :
                     r.tipo === 'troca_filtros' ? 'Troca de Filtros' :
                     r.tipo === 'troca_bateria' ? 'Troca de Bateria' : 'Outra'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {r.data_revisao ? format(new Date(r.data_revisao + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {r.km_atual != null && (
                  <span className="text-muted-foreground">{Number(r.km_atual).toLocaleString('pt-BR')} km</span>
                )}
                {r.valor != null && (
                  <span className="font-medium">{formatCurrency(Number(r.valor))}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.realizada ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.realizada ? 'Realizada' : 'Pendente'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); r.id && handleDelete(r.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
