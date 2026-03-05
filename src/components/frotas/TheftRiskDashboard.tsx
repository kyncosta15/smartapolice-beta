import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, ShieldAlert, Car, TrendingUp, Upload, Plus, 
  Calendar, Shield, BarChart3, PieChart, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { format, subDays, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TheftEvent {
  id: string;
  vehicle_id: string;
  empresa_id: string;
  event_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface RiskReference {
  id: string;
  reference_date: string;
  make: string;
  model: string;
  year_from: number | null;
  year_to: number | null;
  risk_score: number;
  risk_level: string;
  source: string | null;
  notes: string | null;
}

interface TheftRiskDashboardProps {
  veiculos: FrotaVeiculo[];
  allVeiculos: FrotaVeiculo[];
  loading: boolean;
}

const RISK_COLORS: Record<string, string> = {
  ALTO: '#ef4444',
  MEDIO: '#f59e0b',
  BAIXO: '#22c55e',
  SEM_DADO: '#94a3b8',
};

export function TheftRiskDashboard({ veiculos, allVeiculos, loading }: TheftRiskDashboardProps) {
  const { activeEmpresaId } = useTenant();
  const { toast } = useToast();
  const [theftEvents, setTheftEvents] = useState<TheftEvent[]>([]);
  const [riskReferences, setRiskReferences] = useState<RiskReference[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addRiskModalOpen, setAddRiskModalOpen] = useState(false);
  const [riskForm, setRiskForm] = useState({
    make: '', model: '', risk_level: 'MEDIO', risk_score: 50, source: '', notes: ''
  });

  useEffect(() => {
    if (activeEmpresaId) {
      loadData();
    }
  }, [activeEmpresaId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [eventsRes, riskRes] = await Promise.all([
        supabase
          .from('vehicle_theft_events')
          .select('*')
          .eq('empresa_id', activeEmpresaId!)
          .order('event_date', { ascending: false }),
        supabase
          .from('theft_risk_reference')
          .select('*')
          .order('reference_date', { ascending: false })
      ]);

      setTheftEvents((eventsRes.data || []) as TheftEvent[]);
      setRiskReferences((riskRes.data || []) as RiskReference[]);
    } catch (err) {
      console.error('Erro ao carregar dados de risco:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const d30 = subDays(now, 30);
    const d90 = subDays(now, 90);
    const d180 = subDays(now, 180);

    const robberies = theftEvents.filter(e => e.status === 'ROUBADO');
    const roubadosAtualmente = allVeiculos.filter(v => (v as any).is_stolen_current === true).length;
    const roubos30 = robberies.filter(e => new Date(e.event_date) >= d30).length;
    const roubos90 = robberies.filter(e => new Date(e.event_date) >= d90).length;
    const roubos180 = robberies.filter(e => new Date(e.event_date) >= d180).length;

    // Risk distribution
    const latestRefDate = riskReferences.length > 0 ? riskReferences[0].reference_date : null;
    const latestRefs = latestRefDate 
      ? riskReferences.filter(r => r.reference_date === latestRefDate) 
      : [];

    let altoCount = 0;
    allVeiculos.forEach(v => {
      const match = latestRefs.find(r => 
        r.make.toLowerCase() === (v.marca || '').toLowerCase() &&
        r.model.toLowerCase() === (v.modelo || '').toLowerCase() &&
        (r.year_from == null || (v.ano_modelo || 0) >= r.year_from) &&
        (r.year_to == null || (v.ano_modelo || 0) <= r.year_to)
      );
      if (match?.risk_level === 'ALTO') altoCount++;
    });

    const percentAlto = allVeiculos.length > 0 ? ((altoCount / allVeiculos.length) * 100).toFixed(1) : '0';

    // Top models
    const modelCount: Record<string, number> = {};
    robberies.forEach(e => {
      const v = allVeiculos.find(ve => ve.id === e.vehicle_id);
      if (v) {
        const key = `${v.marca || ''} ${v.modelo || ''}`.trim();
        modelCount[key] = (modelCount[key] || 0) + 1;
      }
    });
    const topModels = Object.entries(modelCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total: allVeiculos.length,
      roubadosAtualmente,
      roubos30, roubos90, roubos180,
      percentAlto,
      altoCount,
      topModels,
    };
  }, [allVeiculos, theftEvents, riskReferences]);

  // Chart: roubos por mês
  const theftsByMonth = useMemo(() => {
    const robberies = theftEvents.filter(e => e.status === 'ROUBADO');
    const months: Record<string, number> = {};
    
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(startOfMonth(d), 'yyyy-MM');
      months[key] = 0;
    }

    robberies.forEach(e => {
      const key = format(new Date(e.event_date), 'yyyy-MM');
      if (months[key] !== undefined) months[key]++;
    });

    return Object.entries(months).map(([month, count]) => ({
      month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
      roubos: count,
    }));
  }, [theftEvents]);

  // Chart: top modelos roubados
  const topModelsChart = useMemo(() => {
    return kpis.topModels.map(([model, count]) => ({
      modelo: model || 'Desconhecido',
      roubos: count,
    }));
  }, [kpis.topModels]);

  // Chart: risk distribution (donut)
  const riskDistribution = useMemo(() => {
    const latestRefDate = riskReferences.length > 0 ? riskReferences[0].reference_date : null;
    const latestRefs = latestRefDate 
      ? riskReferences.filter(r => r.reference_date === latestRefDate) 
      : [];

    const dist: Record<string, number> = { ALTO: 0, MEDIO: 0, BAIXO: 0, SEM_DADO: 0 };

    allVeiculos.forEach(v => {
      const match = latestRefs.find(r => 
        r.make.toLowerCase() === (v.marca || '').toLowerCase() &&
        r.model.toLowerCase() === (v.modelo || '').toLowerCase() &&
        (r.year_from == null || (v.ano_modelo || 0) >= r.year_from) &&
        (r.year_to == null || (v.ano_modelo || 0) <= r.year_to)
      );
      dist[match?.risk_level || 'SEM_DADO']++;
    });

    return Object.entries(dist)
      .filter(([, v]) => v > 0)
      .map(([level, count]) => ({
        name: level === 'SEM_DADO' ? 'Sem dado' : level.charAt(0) + level.slice(1).toLowerCase(),
        value: count,
        fill: RISK_COLORS[level],
      }));
  }, [allVeiculos, riskReferences]);

  // Alerts: high risk vehicles not stolen
  const alerts = useMemo(() => {
    const latestRefDate = riskReferences.length > 0 ? riskReferences[0].reference_date : null;
    const latestRefs = latestRefDate 
      ? riskReferences.filter(r => r.reference_date === latestRefDate) 
      : [];

    return allVeiculos
      .filter(v => !(v as any).is_stolen_current)
      .map(v => {
        const match = latestRefs.find(r => 
          r.make.toLowerCase() === (v.marca || '').toLowerCase() &&
          r.model.toLowerCase() === (v.modelo || '').toLowerCase() &&
          (r.year_from == null || (v.ano_modelo || 0) >= r.year_from) &&
          (r.year_to == null || (v.ano_modelo || 0) <= r.year_to)
        );
        return match?.risk_level === 'ALTO' ? { ...v, riskScore: match.risk_score } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.riskScore - a.riskScore)
      .slice(0, 10) as (FrotaVeiculo & { riskScore: number })[];
  }, [allVeiculos, riskReferences]);

  // Exposure value
  const exposureByRisk = useMemo(() => {
    const latestRefDate = riskReferences.length > 0 ? riskReferences[0].reference_date : null;
    const latestRefs = latestRefDate 
      ? riskReferences.filter(r => r.reference_date === latestRefDate) 
      : [];

    const exposure: Record<string, number> = { ALTO: 0, MEDIO: 0, BAIXO: 0 };

    allVeiculos.forEach(v => {
      const match = latestRefs.find(r => 
        r.make.toLowerCase() === (v.marca || '').toLowerCase() &&
        r.model.toLowerCase() === (v.modelo || '').toLowerCase()
      );
      if (match && v.preco_fipe) {
        exposure[match.risk_level] = (exposure[match.risk_level] || 0) + v.preco_fipe;
      }
    });

    return exposure;
  }, [allVeiculos, riskReferences]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleAddRisk = async () => {
    if (!riskForm.make || !riskForm.model) {
      toast({ title: 'Preencha marca e modelo', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('theft_risk_reference').insert({
      reference_date: format(new Date(), 'yyyy-MM-dd'),
      make: riskForm.make,
      model: riskForm.model,
      risk_level: riskForm.risk_level,
      risk_score: riskForm.risk_score,
      source: riskForm.source || 'Manual',
      notes: riskForm.notes || null,
    } as any);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Referência de risco adicionada' });
      setAddRiskModalOpen(false);
      setRiskForm({ make: '', model: '', risk_level: 'MEDIO', risk_score: 50, source: '', notes: '' });
      loadData();
    }
  };

  const isLoading = loading || loadingData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Risco e Roubos
          </h2>
          <p className="text-sm text-muted-foreground">Dashboard de risco da frota e histórico de roubos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setAddRiskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar Risco
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground">Total Veículos</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{kpis.roubadosAtualmente}</div>
            <p className="text-xs text-muted-foreground">Roubados Atualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kpis.roubos30}</div>
            <p className="text-xs text-muted-foreground">Roubos (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kpis.roubos90}</div>
            <p className="text-xs text-muted-foreground">Roubos (90d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kpis.roubos180}</div>
            <p className="text-xs text-muted-foreground">Roubos (180d)</p>
          </CardContent>
        </Card>
        <Card className={Number(kpis.percentAlto) > 10 ? 'border-destructive/30' : ''}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{kpis.percentAlto}%</div>
            <p className="text-xs text-muted-foreground">Frota Risco Alto</p>
          </CardContent>
        </Card>
      </div>

      {/* Exposure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Exposição Risco Alto</span>
            </div>
            <div className="text-xl font-bold text-destructive">
              {formatCurrency(exposureByRisk.ALTO || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">Exposição Risco Médio</span>
            </div>
            <div className="text-xl font-bold text-yellow-600">
              {formatCurrency(exposureByRisk.MEDIO || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Exposição Risco Baixo</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(exposureByRisk.BAIXO || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roubos por mês */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Roubos por Mês (últimos 12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {theftsByMonth.some(m => m.roubos > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={theftsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="roubos" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Nenhum evento de roubo registrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top modelos roubados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Modelos Roubados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topModelsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topModelsChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="modelo" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="roubos" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Nenhum roubo registrado na frota
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de risco */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Distribuição de Risco da Frota
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Nenhuma referência de risco cadastrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alertas — Veículos em Risco Alto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {alerts.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <span className="font-mono text-sm">{v.placa}</span>
                      <span className="text-sm text-muted-foreground ml-2">{v.marca} {v.modelo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Score: {v.riskScore}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Nenhum veículo em risco alto identificado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent theft events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Histórico de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {theftEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-left py-2 px-2">Veículo</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {theftEvents.slice(0, 20).map(event => {
                    const v = allVeiculos.find(ve => ve.id === event.vehicle_id);
                    return (
                      <tr key={event.id} className="border-b last:border-0">
                        <td className="py-2 px-2">
                          {format(new Date(event.event_date), 'dd/MM/yyyy')}
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-mono">{v?.placa || '—'}</span>
                          <span className="text-muted-foreground ml-1">{v?.marca} {v?.modelo}</span>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={event.status === 'ROUBADO' ? 'destructive' : 'default'} className="text-xs">
                            {event.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground max-w-[200px] truncate">
                          {event.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
          )}
        </CardContent>
      </Card>

      {/* Add Risk Reference Modal */}
      <Dialog open={addRiskModalOpen} onOpenChange={setAddRiskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Referência de Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={riskForm.make} onChange={e => setRiskForm(f => ({ ...f, make: e.target.value }))} placeholder="Ex: FIAT" />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input value={riskForm.model} onChange={e => setRiskForm(f => ({ ...f, model: e.target.value }))} placeholder="Ex: MOBI" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nível de Risco</Label>
                <Select value={riskForm.risk_level} onValueChange={v => setRiskForm(f => ({ ...f, risk_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXO">Baixo</SelectItem>
                    <SelectItem value="MEDIO">Médio</SelectItem>
                    <SelectItem value="ALTO">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score (0-100)</Label>
                <Input type="number" min={0} max={100} value={riskForm.risk_score} onChange={e => setRiskForm(f => ({ ...f, risk_score: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Input value={riskForm.source} onChange={e => setRiskForm(f => ({ ...f, source: e.target.value }))} placeholder="Ex: SSP, Seguradora" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={riskForm.notes} onChange={e => setRiskForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRiskModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddRisk}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
