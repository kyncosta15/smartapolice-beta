import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Plus, Pencil, Check, X, Trash2, CalendarDays, Loader2 } from 'lucide-react';

interface Parcela {
  id: string;
  endosso_id: string;
  numero_parcela: number;
  valor: number;
  vencimento: string;
  status: string;
}

interface EndossoParcelasSectionProps {
  endossoId: string;
}

export function EndossoParcelasSection({ endossoId }: EndossoParcelasSectionProps) {
  const { toast } = useToast();
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ valor: '', vencimento: '', status: 'a vencer' });
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newData, setNewData] = useState({ valor: '', vencimento: '', status: 'a vencer' });

  useEffect(() => {
    loadParcelas();
  }, [endossoId]);

  const loadParcelas = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('endosso_parcelas')
        .select('*')
        .eq('endosso_id', endossoId)
        .order('numero_parcela', { ascending: true });

      if (error) throw error;
      setParcelas(data || []);
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addParcela = async () => {
    if (!newData.valor || !newData.vencimento) {
      toast({ title: 'Preencha valor e vencimento', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const valorNum = parseFloat(newData.valor.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const nextNum = parcelas.length > 0 ? Math.max(...parcelas.map(p => p.numero_parcela)) + 1 : 1;

      const { error } = await (supabase as any)
        .from('endosso_parcelas')
        .insert({
          endosso_id: endossoId,
          numero_parcela: nextNum,
          valor: valorNum,
          vencimento: newData.vencimento,
          status: newData.status,
        });

      if (error) throw error;
      toast({ title: '✅ Parcela adicionada' });
      setAdding(false);
      setNewData({ valor: '', vencimento: '', status: 'a vencer' });
      loadParcelas();
    } catch (error: any) {
      toast({ title: '❌ Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Parcela) => {
    setEditingId(p.id);
    setEditData({ valor: p.valor.toString(), vencimento: p.vencimento, status: p.status });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const valorNum = parseFloat(editData.valor.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const { error } = await (supabase as any)
        .from('endosso_parcelas')
        .update({ valor: valorNum, vencimento: editData.vencimento, status: editData.status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: '✅ Parcela atualizada' });
      setEditingId(null);
      loadParcelas();
    } catch (error: any) {
      toast({ title: '❌ Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteParcela = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('endosso_parcelas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Parcela removida' });
      loadParcelas();
    } catch (error: any) {
      toast({ title: '❌ Erro', description: error.message, variant: 'destructive' });
    }
  };

  const formatDateBR = (d: string) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500">Pago</span>;
      case 'vencido':
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">Vencido</span>;
      default:
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">A vencer</span>;
    }
  };

  if (loading) return null;

  const totalParcelas = parcelas.reduce((s, p) => s + p.valor, 0);

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          Parcelas ({parcelas.length})
          {totalParcelas > 0 && (
            <span className="ml-1 text-foreground">· {formatCurrency(totalParcelas)}</span>
          )}
        </span>
        {!adding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            className="h-6 px-2 text-xs text-primary hover:bg-muted"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Form para nova parcela */}
      {adding && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-muted/50 border border-border">
          <Input
            type="text"
            placeholder="Valor"
            value={newData.valor}
            onChange={(e) => setNewData(prev => ({ ...prev, valor: e.target.value }))}
            className="h-7 text-xs flex-1 max-w-[100px]"
            autoFocus
          />
          <Input
            type="date"
            value={newData.vencimento}
            onChange={(e) => setNewData(prev => ({ ...prev, vencimento: e.target.value }))}
            className="h-7 text-xs flex-1 max-w-[130px]"
          />
          <select
            value={newData.status}
            onChange={(e) => setNewData(prev => ({ ...prev, status: e.target.value }))}
            className="h-7 text-xs rounded-md border border-input bg-background px-1"
          >
            <option value="a vencer">A vencer</option>
            <option value="pago">Pago</option>
            <option value="vencido">Vencido</option>
          </select>
          <Button variant="ghost" size="sm" onClick={addParcela} disabled={saving} className="h-7 w-7 p-0 text-green-500 hover:bg-green-500/10">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewData({ valor: '', vencimento: '', status: 'a vencer' }); }} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Lista de parcelas */}
      {parcelas.length > 0 && (
        <div className="space-y-1">
          {parcelas.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors group">
              {editingId === p.id ? (
                <>
                  <span className="text-xs text-muted-foreground w-5 text-center">{p.numero_parcela}</span>
                  <Input
                    type="text"
                    value={editData.valor}
                    onChange={(e) => setEditData(prev => ({ ...prev, valor: e.target.value }))}
                    className="h-6 text-xs flex-1 max-w-[90px]"
                    autoFocus
                  />
                  <Input
                    type="date"
                    value={editData.vencimento}
                    onChange={(e) => setEditData(prev => ({ ...prev, vencimento: e.target.value }))}
                    className="h-6 text-xs flex-1 max-w-[120px]"
                  />
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                    className="h-6 text-xs rounded-md border border-input bg-background px-1"
                  >
                    <option value="a vencer">A vencer</option>
                    <option value="pago">Pago</option>
                    <option value="vencido">Vencido</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => saveEdit(p.id)} disabled={saving} className="h-6 w-6 p-0 text-green-500">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-6 w-6 p-0 text-destructive">
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-muted-foreground w-5 text-center">{p.numero_parcela}</span>
                  <span className="text-xs font-medium text-foreground flex-1">{formatCurrency(p.valor)}</span>
                  <span className="text-xs text-muted-foreground">{formatDateBR(p.vencimento)}</span>
                  {getStatusBadge(p.status)}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p)} className="h-6 w-6 p-0 hover:bg-muted">
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteParcela(p.id)} className="h-6 w-6 p-0 hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
