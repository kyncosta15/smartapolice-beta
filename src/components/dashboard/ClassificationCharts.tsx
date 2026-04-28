
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Label } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { NewPolicyModal } from '../NewPolicyModal';
import { FileText, Calendar, DollarSign, Clock, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClassificationChartsProps {
  typeDistribution: Array<{ name: string; value: number; color: string }>;
  insurerDistribution: Array<{ name: string; value: number; color: string }>;
  recentPolicies: Array<{
    name: string;
    insurer: string;
    value: number;
    dueDate: string;
    insertDate: string;
    type?: string;
    status?: string;
  }>;
  colors: string[];
}

// Cores específicas para cada tipo de seguradora
const INSURER_COLORS: Record<string, string> = {
  'Porto Seguro': '#e11d48',
  'Porto Seguro Cia. de Seguros Gerais': '#e11d48',
  'Bradesco': '#059669',
  'Bradesco Seguros': '#059669',
  'SulAmérica': '#2563eb',
  'Allianz': '#f59e0b',
  'HDI Seguros': '#8b5cf6',
  'HDI SEGUROS S.A.': '#8b5cf6',
  'HDI': '#8b5cf6',
  'Liberty Seguros': '#06b6d4',
  'Liberty': '#06b6d4',
  'Tokio Marine': '#ec4899',
  'Mapfre': '#84cc16',
  'Zurich': '#1d4ed8',
  'Darwin Seguros S.A.': '#ef4444',
  'Sompo Seguros': '#f97316',
  'Itaú Seguros': '#10b981',
  'Azul Seguros': '#3b82f6',
  'Alfa Seguradora': '#7c3aed',
  'Suhai Seguradora': '#14b8a6',
  'Excelsior Seguros': '#f59e0b',
  'Too Seguros': '#6366f1',
  'Icatu Seguros': '#8b5cf6',
  'Capemisa': '#10b981',
  'MetLife': '#059669',
  'Prudential': '#2563eb',
  'Youse': '#ef4444',
  'Seguros Unimed': '#22c55e',
  'Centauro-ON': '#f97316',
  'BB Seguros': '#eab308',
  'Assurant': '#6b7280',
  'Não informado': '#9ca3af',
  'Outros': '#6b7280'
};

// Cores para tipos de seguro
const TYPE_COLORS: Record<string, string> = {
  'Auto': '#3b82f6',
  'Vida': '#10b981',
  'Saúde': '#f59e0b',
  'Empresarial': '#8b5cf6',
  'Patrimonial': '#ef4444',
  'Acidentes Pessoais': '#06b6d4',
  'Responsabilidade Civil': '#84cc16',
  'Outros': '#6b7280'
};

export function ClassificationCharts({ 
  typeDistribution, 
  insurerDistribution, 
  recentPolicies, 
  colors 
}: ClassificationChartsProps) {
  const isMobile = useIsMobile();
  const [selectedPolicy, setSelectedPolicy] = useState<typeof recentPolicies[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Evita bug de timezone: new Date('YYYY-MM-DD') interpreta como UTC e pode mostrar -1 dia no Brasil
  const formatCalendarDatePtBr = (value?: string | null) => {
    if (!value) return '';
    const clean = String(value).split('T')[0];
    const [y, m, d] = clean.split('-');
    if (y && m && d && y.length === 4) return `${d}/${m}/${y}`;
    // fallback para strings não-ISO
    try {
      return new Date(String(value)).toLocaleDateString('pt-BR');
    } catch {
      return String(value);
    }
  };

  // Calculate total for donut chart center
  const totalPolicies = React.useMemo(() => {
    return typeDistribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [typeDistribution]);

  // Helper function to safely render insurer values
  const safeRenderInsurer = (insurer: any): string => {
    if (!insurer) return "Não informado";
    if (typeof insurer === "string") return insurer;
    if (typeof insurer === "object") {
      return insurer.empresa || insurer.name || insurer.categoria || "Seguradora";
    }
    return String(insurer);
  };

  const handlePolicyClick = (policy: typeof recentPolicies[0]) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  // Aplicar cores específicas aos dados de distribuição
  const typeDistributionWithColors = typeDistribution.map(item => ({
    ...item,
    color: TYPE_COLORS[item.name] || item.color || '#6b7280'
  }));

  const insurerDistributionWithColors = insurerDistribution.map(item => ({
    ...item,
    color: INSURER_COLORS[item.name] || item.color || '#6b7280'
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${label}`}</p>
          <p className="text-sm text-primary">{`Valor: ${payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-3 border border-border rounded-lg shadow-lg min-w-[160px]">
          <p className="text-sm font-semibold mb-1">{payload[0].name}</p>
          <p className="text-base font-bold text-primary">
            {`Valor: ${payload[0].value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Distribuição por Tipo */}
        <Card className="bg-card border border-border shadow-sm" data-chart="type-distribution">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-foreground`}>
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {typeDistributionWithColors.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                  <Tooltip content={<PieTooltip />} />
                  <Pie
                    data={typeDistributionWithColors}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ value }: any) => {
                      return value.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      });
                    }}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    {typeDistributionWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Seguradora */}
        <Card className="bg-card border border-border shadow-sm" data-chart="insurer-distribution">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-foreground`}>
              Distribuição por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {insurerDistributionWithColors.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                <BarChart 
                  data={insurerDistributionWithColors} 
                  layout="vertical"
                  margin={{ top: 5, right: isMobile ? 70 : 100, left: 10, bottom: 5 }}
                  barSize={isMobile ? 20 : 28}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 100 : 140}
                    hide
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    radius={4}
                  >
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={10}
                      style={{ fill: 'white', fontSize: isMobile ? 9 : 11, fontWeight: 600 }}
                      formatter={(value: string) => {
                        if (!value) return '';
                        const maxLen = isMobile ? 12 : 18;
                        // Remove sufixos comuns que ocupam espaço
                        let clean = value
                          .replace(/\s+S\.?\s?A\.?$/i, '')
                          .replace(/\s+SEGUROS?$/i, '')
                          .replace(/\s+DO\s+BRASIL$/i, ' BR')
                          .trim();
                        if (clean.length > maxLen) {
                          clean = clean.substring(0, maxLen - 1) + '…';
                        }
                        return clean;
                      }}
                    />
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={12}
                      style={{
                        fontSize: isMobile ? 11 : 14,
                        fontWeight: 700,
                        fill: 'hsl(var(--foreground))',
                        letterSpacing: '0.02em',
                      }}
                      formatter={(value: number) => {
                        return value.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        });
                      }}
                    />
                    {insurerDistributionWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Novas Apólices (30 dias) - Span completo */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Novas Apólices</span>
              <span className="text-xs font-normal text-muted-foreground">últimos 30 dias</span>
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                {recentPolicies.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPolicies.length > 0 ? (
              <div className="divide-y divide-border/60 -mx-2">
                {recentPolicies.slice(0, 5).map((policy, index) => {
                  // Determinar status baseado em dueDate
                  const isExpired = (() => {
                    if (!policy.dueDate) return false;
                    const clean = String(policy.dueDate).split('T')[0];
                    const [y, m, d] = clean.split('-').map(Number);
                    if (!y || !m || !d) return false;
                    const due = new Date(y, m - 1, d);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return due.getTime() < today.getTime();
                  })();

                  return (
                    <div
                      key={index}
                      className="group flex items-center justify-between gap-3 px-2 py-3 hover:bg-accent/40 cursor-pointer transition-colors"
                      onClick={() => handlePolicyClick(policy)}
                    >
                      {/* Nome + seguradora + tipo + badge status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {policy.name}
                          </p>
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-semibold">
                              <AlertCircle className="h-3 w-3" />
                              Vencida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" />
                              Vigente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {safeRenderInsurer(policy.insurer)}
                          {policy.type && (
                            <>
                              <span className="mx-1.5 opacity-50">•</span>
                              <span className="capitalize">{policy.type}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Valor */}
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {policy.value.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">prêmio total</p>
                      </div>

                      {/* Datas */}
                      <div className="hidden md:flex items-center gap-5 text-xs shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inserida</p>
                          <p className="font-semibold text-foreground tabular-nums mt-0.5">
                            {formatCalendarDatePtBr(policy.insertDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vencimento</p>
                          <p className={`font-semibold tabular-nums mt-0.5 ${isExpired ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatCalendarDatePtBr(policy.dueDate)}
                          </p>
                        </div>
                      </div>

                      {/* Ação: ver detalhes */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePolicyClick(policy); }}
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Ver detalhes da apólice"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma apólice recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para exibir detalhes da nova apólice */}
      <NewPolicyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        policy={selectedPolicy}
      />
    </>
  );
}
