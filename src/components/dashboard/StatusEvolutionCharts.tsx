
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatusEvolutionChartsProps {
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; custo: number; apolices: number }>;
  colors: string[];
}

export function StatusEvolutionCharts({ statusDistribution, monthlyEvolution, colors }: StatusEvolutionChartsProps) {
  const isMobile = useIsMobile();
  
  console.log('📊 StatusEvolutionCharts - Dados recebidos:', {
    statusDistribution: statusDistribution?.length,
    statusData: statusDistribution,
    monthlyEvolution: monthlyEvolution?.length,
    monthlyData: monthlyEvolution,
    colors: colors?.length
  });

  // Cores otimizadas com gradientes para cada status
  const statusColors = {
    'Ativo': '#10b981',      // Verde
    'Vencido': '#ef4444',    // Vermelho
    'A Vencer': '#f59e0b',   // Laranja
    'Cancelado': '#6b7280',  // Cinza
    'Renovado': '#3b82f6',   // Azul
    'Suspenso': '#8b5cf6'    // Roxo
  };

  const getStatusColor = (statusName: string) => {
    return statusColors[statusName as keyof typeof statusColors] || colors[0] || '#6b7280';
  };

  return (
    <div className={`w-full ${isMobile ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'} print-status-charts overflow-x-hidden`}>
      <Card className="print-chart-card bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg backdrop-blur-sm w-full overflow-hidden">
        <CardHeader className={`border-b border-red-100 bg-gradient-to-r from-red-50/50 to-white ${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
            <div className={`p-2 bg-gradient-to-br from-red-100 to-red-200 rounded-lg mr-3 shadow-sm ${isMobile ? 'p-1' : ''}`}>
              <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} text-red-600`} />
            </div>
            <div>
              <span className="bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent font-bold">
                Status das Apólices
              </span>
            </div>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-2 font-medium`}>
            Total de {statusDistribution.reduce((sum, item) => sum + item.value, 0)} apólices analisadas
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-48' : 'h-80'} w-full`}>
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
                  outerRadius={isMobile ? 60 : 100}
                  innerRadius={isMobile ? 25 : 40}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent, value }) => isMobile ? `${value}` : `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={false}
                  fontSize={isMobile ? 10 : 12}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`status-cell-${entry.name}-${index}`} 
                      fill={`url(#statusGradient-${index})`}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} apólices`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    backdropFilter: 'blur(8px)',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda detalhada otimizada */}
          <div className={`${isMobile ? 'mt-2 space-y-1' : 'mt-4 grid grid-cols-1 gap-3'} bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100`}>
            {statusDistribution.map((entry, index) => (
              <div key={`legend-${entry.name}`} className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div className="flex items-center gap-2">
                  <div 
                    className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full shadow-sm`}
                    style={{ 
                      background: `linear-gradient(135deg, ${getStatusColor(entry.name)}, ${getStatusColor(entry.name)}cc)`
                    }}
                  />
                  <span className="font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className={`font-bold text-gray-800 bg-gray-100 ${isMobile ? 'px-1 py-0.5 text-xs' : 'px-2 py-1'} rounded-lg`}>
                  {entry.value} apólices
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="print-chart-card bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg backdrop-blur-sm w-full overflow-hidden">
        <CardHeader className={`border-b border-blue-100 bg-gradient-to-r from-blue-50/50 to-white ${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
            <div className={`p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-3 shadow-sm ${isMobile ? 'p-1' : ''}`}>
              <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} text-blue-600`} />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent font-bold">
                Evolução de Custos Mensais
              </span>
            </div>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-2 font-medium`}>
            Evolução baseada em dados reais das apólices
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-48' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution} margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 20 } : { top: 20, right: 30, left: 20, bottom: 40 }}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                    <stop offset="100%" stopColor="rgba(59, 130, 246, 0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(148, 163, 184, 0.3)" 
                  strokeWidth={1}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b', fontWeight: 500 }}
                  tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 50 : 40}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 12, fill: '#64748b', fontWeight: 500 }}
                  tickFormatter={(value) => formatCurrency(value, { showSymbol: false })}
                  tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  width={isMobile ? 60 : 80}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Custo Mensal']} 
                  labelFormatter={(label) => `Período: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    backdropFilter: 'blur(8px)',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                  cursor={{
                    stroke: 'rgba(59, 130, 246, 0.2)',
                    strokeWidth: 2,
                    fill: 'url(#areaGradient)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="custo" 
                  stroke="url(#costGradient)"
                  strokeWidth={isMobile ? 2 : 4}
                  dot={{ 
                    fill: '#fff', 
                    strokeWidth: isMobile ? 2 : 3, 
                    r: isMobile ? 3 : 5,
                    stroke: '#3B82F6',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                  activeDot={{ 
                    r: isMobile ? 5 : 7, 
                    stroke: '#3B82F6', 
                    strokeWidth: isMobile ? 2 : 3, 
                    fill: '#fff',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Resumo estatístico otimizado */}
          <div className={`${isMobile ? 'mt-2 grid grid-cols-3 gap-2' : 'mt-4 grid grid-cols-3 gap-4'} text-center`}>
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 ${isMobile ? 'p-2' : 'p-4'} rounded-xl border border-blue-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 font-semibold uppercase tracking-wide`}>Custo Médio</p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-blue-700 mt-1`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(monthlyEvolution.reduce((sum, item) => sum + item.custo, 0) / monthlyEvolution.length) : 
                  formatCurrency(0)
                }
              </p>
            </div>
            <div className={`bg-gradient-to-br from-green-50 to-emerald-50 ${isMobile ? 'p-2' : 'p-4'} rounded-xl border border-green-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-green-600 font-semibold uppercase tracking-wide`}>Maior Custo</p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-green-700 mt-1`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(Math.max(...monthlyEvolution.map(item => item.custo))) : 
                  formatCurrency(0)
                }
              </p>
            </div>
            <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 ${isMobile ? 'p-2' : 'p-4'} rounded-xl border border-orange-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-orange-600 font-semibold uppercase tracking-wide`}>Custo Atual</p>
              <p className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-orange-700 mt-1`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].custo) : 
                  formatCurrency(0)
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
