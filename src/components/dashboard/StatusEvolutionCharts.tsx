import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useIsMobile } from '@/hooks/use-mobile';
import { getChartColor } from '@/utils/statusColors';

interface StatusEvolutionChartsProps {
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; custo: number; apolices: number }>;
  colors: string[];
}

export function StatusEvolutionCharts({ statusDistribution, monthlyEvolution }: StatusEvolutionChartsProps) {
  const isMobile = useIsMobile();

  const getStatusColor = (statusName: string) => {
    const statusMap: Record<string, string> = {
      ATIVA: 'ativa',
      VIGENTE: 'vigente',
      VENCIDA: 'vencida',
      'ANOS ANTERIORES': 'anos_anteriores',
      VENCENDO: 'vencendo',
      'A VENCER': 'vencendo',
      'NÃO RENOVADA': 'nao_renovada',
      CANCELADO: 'nao_renovada',
      SUSPENSO: 'pendente_analise',
      'AGUARDANDO EMISSÃO': 'aguardando_emissao',
      RENOVADO: 'aguardando_emissao',
    };
    // Paleta refinada: usa cores próprias para o gráfico em vez do default
    const customPalette: Record<string, string> = {
      ativa: '#10b981',           // Emerald — vivo e legível em ambos modos
      vigente: '#10b981',
      vencendo: '#f59e0b',        // Âmbar — alerta sem ser agressivo
      anos_anteriores: '#64748b', // Slate — neutro elegante
      nao_renovada: '#ef4444',
      vencida: '#ef4444',
      renovada: '#3b82f6',
      aguardando_emissao: '#6366f1',
      pendente_analise: '#eab308',
    };
    const mappedStatus = statusMap[statusName.toUpperCase()] || statusName.toLowerCase().replace(/\s+/g, '_');
    return customPalette[mappedStatus] || getChartColor(mappedStatus);
  };

  return (
    <div className={`w-full ${isMobile ? 'space-y-3 px-1' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'} print-status-charts overflow-hidden`}>
      {/* Status das Apólices */}
      <Card
        className="print-chart-card border border-border bg-card shadow-sm w-full overflow-hidden"
        data-chart="status-distribution"
      >
        <CardHeader className={`border-b border-border bg-muted/30 ${isMobile ? 'p-2 pb-1' : 'p-4'}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-xs' : 'text-lg'} text-foreground`}>
            <div className={`bg-primary/10 rounded-lg mr-2 ${isMobile ? 'p-1' : 'p-2'}`}>
              <Calendar className={`${isMobile ? 'h-2 w-2' : 'h-5 w-5'} text-primary`} />
            </div>
            <span className="font-semibold">{isMobile ? 'Status' : 'Status das Apólices'}</span>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1 font-medium`}>
            Total: {statusDistribution.reduce((sum, item) => sum + item.value, 0)} apólices
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-2 pt-1' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-32' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {statusDistribution.map((entry, index) => (
                    <linearGradient key={`gradient-${entry.name}`} id={`statusGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={getStatusColor(entry.name)} stopOpacity={1} />
                      <stop offset="100%" stopColor={getStatusColor(entry.name)} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 40 : 100}
                  innerRadius={isMobile ? 15 : 40}
                  dataKey="value"
                  label={
                    isMobile
                      ? false
                      : ({ name, percent, value, x, y, cx }: any) => (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--foreground))"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={500}
                          >
                            {`${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                          </text>
                        )
                  }
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeOpacity: 0.5 }}
                  fontSize={isMobile ? 8 : 12}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`status-cell-${entry.name}-${index}`}
                      fill={`url(#statusGradient-${index})`}
                      stroke="hsl(var(--card))"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} apólices`, name]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    fontSize: isMobile ? '10px' : '14px',
                  }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda */}
          <div
            className={`${
              isMobile ? 'mt-2 grid grid-cols-2 gap-1' : 'mt-4 grid grid-cols-1 gap-3'
            } bg-muted/30 p-2 rounded-xl border border-border`}
          >
            {statusDistribution.map((entry) => (
              <div
                key={`legend-${entry.name}`}
                className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm justify-between'}`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full flex-shrink-0`}
                    style={{ background: getStatusColor(entry.name) }}
                  />
                  <span className="font-medium text-foreground truncate">{entry.name}</span>
                </div>
                {!isMobile && (
                  <span className="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md text-xs">
                    {entry.value}
                  </span>
                )}
                {isMobile && <span className="text-xs font-semibold text-foreground">{entry.value}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evolução de Custos */}
      <Card
        className="print-chart-card border border-border bg-card shadow-sm w-full overflow-hidden"
        data-chart="monthly-evolution"
      >
        <CardHeader className={`border-b border-border bg-muted/30 ${isMobile ? 'p-2 pb-1' : 'p-4'}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-xs' : 'text-lg'} text-foreground`}>
            <div className={`bg-primary/10 rounded-lg mr-2 ${isMobile ? 'p-1' : 'p-2'}`}>
              <TrendingUp className={`${isMobile ? 'h-2 w-2' : 'h-5 w-5'} text-primary`} />
            </div>
            <span className="font-semibold">{isMobile ? 'Evolução' : 'Evolução de Custos Mensais'}</span>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mt-1 font-medium`}>
            Evolução baseada em dados reais das apólices
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-2 pt-1' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-32' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyEvolution}
                margin={isMobile ? { top: 5, right: 10, left: 10, bottom: 15 } : { top: 20, right: 40, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} strokeWidth={1} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: isMobile ? 8 : 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 25 : 40}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 8 : 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  tickFormatter={(value) =>
                    formatCurrency(value, { showSymbol: false, minimumFractionDigits: 0, maximumFractionDigits: 0 })
                  }
                  tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={isMobile ? 60 : 80}
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    'Custo Mensal',
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    fontSize: isMobile ? '10px' : '14px',
                  }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Line
                  type="monotone"
                  dataKey="custo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{
                    fill: 'hsl(var(--card))',
                    strokeWidth: isMobile ? 1 : 2,
                    r: isMobile ? 2 : 4,
                    stroke: 'hsl(var(--primary))',
                  }}
                  activeDot={{
                    r: isMobile ? 3 : 6,
                    stroke: 'hsl(var(--primary))',
                    strokeWidth: isMobile ? 1 : 2,
                    fill: 'hsl(var(--card))',
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* KPI tiles */}
          <div className={`${isMobile ? 'mt-2 grid grid-cols-3 gap-1' : 'mt-4 grid grid-cols-3 gap-4'} text-center`}>
            <div
              className={`bg-muted/30 ${isMobile ? 'p-1.5' : 'p-4'} rounded-xl border border-border min-w-0`}
            >
              <p
                className={`${isMobile ? 'text-[10px] leading-tight' : 'text-xs'} text-muted-foreground font-semibold uppercase tracking-wide`}
              >
                {isMobile ? 'Médio' : 'Custo Médio'}
              </p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-foreground mt-1 truncate`}>
                {monthlyEvolution.length > 0
                  ? formatCurrency(
                      monthlyEvolution.reduce((sum, item) => sum + item.custo, 0) /
                        (monthlyEvolution.filter((m) => m.custo > 0).length || 1),
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )
                  : formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div
              className={`bg-muted/30 ${isMobile ? 'p-1.5' : 'p-4'} rounded-xl border border-border min-w-0`}
            >
              <p
                className={`${isMobile ? 'text-[10px] leading-tight' : 'text-xs'} text-muted-foreground font-semibold uppercase tracking-wide`}
              >
                {isMobile ? 'Maior' : 'Maior Custo'}
              </p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-success mt-1 truncate`}>
                {monthlyEvolution.length > 0
                  ? formatCurrency(Math.max(...monthlyEvolution.map((item) => item.custo)), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div
              className={`bg-muted/30 ${isMobile ? 'p-1.5' : 'p-4'} rounded-xl border border-border min-w-0`}
            >
              <p
                className={`${isMobile ? 'text-[10px] leading-tight' : 'text-xs'} text-muted-foreground font-semibold uppercase tracking-wide`}
              >
                {isMobile ? 'Atual' : 'Custo Atual'}
              </p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-foreground mt-1 truncate`}>
                {monthlyEvolution.length > 0
                  ? formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].custo, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
