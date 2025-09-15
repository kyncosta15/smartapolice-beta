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

export function StatusEvolutionCharts({ statusDistribution, monthlyEvolution, colors }: StatusEvolutionChartsProps) {
  const isMobile = useIsMobile();
  
  console.log('📊 StatusEvolutionCharts - Dados recebidos:', {
    statusDistribution: statusDistribution?.length,
    statusData: statusDistribution,
    monthlyEvolution: monthlyEvolution?.length,
    monthlyData: monthlyEvolution,
    colors: colors?.length
  });

  // Função para obter cor específica do status
  const getStatusColor = (statusName: string) => {
    // Mapear nomes do gráfico para status internos
    const statusMap: Record<string, string> = {
      'ATIVA': 'ativa',
      'VIGENTE': 'vigente', 
      'VENCIDA': 'vencida',
      'VENCENDO': 'vencendo',
      'A VENCER': 'vencendo',
      'NÃO RENOVADA': 'nao_renovada',
      'CANCELADO': 'nao_renovada',
      'SUSPENSO': 'pendente_analise',
      'AGUARDANDO EMISSÃO': 'aguardando_emissao',
      'RENOVADO': 'aguardando_emissao'
    };
    
    const mappedStatus = statusMap[statusName.toUpperCase()] || statusName.toLowerCase();
    return getChartColor(mappedStatus);
  };

  return (
    <div className={`w-full ${isMobile ? 'space-y-3 px-1' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'} print-status-charts overflow-hidden`}>
      <Card className="print-chart-card bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg backdrop-blur-sm w-full overflow-hidden" data-chart="status-distribution">
        <CardHeader className={`border-b border-red-100 bg-gradient-to-r from-red-50/50 to-white ${isMobile ? 'p-2 pb-1' : 'p-4'}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-xs' : 'text-lg'}`}>
            <div className={`p-1 bg-gradient-to-br from-red-100 to-red-200 rounded-lg mr-2 shadow-sm ${isMobile ? 'p-1' : 'p-2'}`}>
              <Calendar className={`${isMobile ? 'h-2 w-2' : 'h-5 w-5'} text-red-600`} />
            </div>
            <div>
              <span className="bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent font-bold">
                {isMobile ? 'Status' : 'Status das Apólices'}
              </span>
            </div>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 font-medium`}>
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
                  fill="#8884d8"
                  dataKey="value"
                  label={isMobile ? false : ({ name, percent, value }: { name: string; percent: number; value: number }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={false}
                  fontSize={isMobile ? 8 : 12}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`status-cell-${entry.name}-${index}`} 
                      fill={`url(#statusGradient-${index})`}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} apólices`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: isMobile ? '10px' : '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda compacta para mobile */}
          <div className={`${isMobile ? 'mt-2 grid grid-cols-2 gap-1' : 'mt-4 grid grid-cols-1 gap-3'} bg-gradient-to-r from-gray-50 to-white p-2 rounded-xl border border-gray-100`}>
            {statusDistribution.map((entry, index) => (
              <div key={`legend-${entry.name}`} className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm justify-between'}`}>
                <div className="flex items-center gap-1">
                  <div 
                    className={`${isMobile ? 'w-2 h-2' : 'w-4 h-4'} rounded-full shadow-sm flex-shrink-0`}
                    style={{ 
                      background: `linear-gradient(135deg, ${getStatusColor(entry.name)}, ${getStatusColor(entry.name)}cc)`
                    }}
                  />
                  <span className="font-medium text-gray-700 truncate">{entry.name}</span>
                </div>
                {!isMobile && (
                  <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                    {entry.value}
                  </span>
                )}
                {isMobile && (
                  <span className="text-xs font-bold text-gray-800">
                    {entry.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="print-chart-card bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg backdrop-blur-sm w-full overflow-hidden" data-chart="monthly-evolution">
        <CardHeader className={`border-b border-blue-100 bg-gradient-to-r from-blue-50/50 to-white ${isMobile ? 'p-2 pb-1' : 'p-4'}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-xs' : 'text-lg'}`}>
            <div className={`p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mr-2 shadow-sm ${isMobile ? 'p-1' : 'p-2'}`}>
              <TrendingUp className={`${isMobile ? 'h-2 w-2' : 'h-5 w-5'} text-blue-600`} />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent font-bold">
                {isMobile ? 'Evolução' : 'Evolução de Custos Mensais'}
              </span>
            </div>
          </CardTitle>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 font-medium`}>
            Evolução baseada em dados reais das apólices
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-2 pt-1' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-32' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution} margin={isMobile ? { top: 5, right: 5, left: 5, bottom: 15 } : { top: 20, right: 30, left: 20, bottom: 40 }}>
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
                  tick={{ fontSize: isMobile ? 8 : 12, fill: '#64748b', fontWeight: 500 }}
                  tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 25 : 40}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 8 : 12, fill: '#64748b', fontWeight: 500 }}
                  tickFormatter={(value) => formatCurrency(value, { showSymbol: false, minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  width={isMobile ? 60 : 80}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Custo Mensal']} 
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: isMobile ? '10px' : '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="custo" 
                  stroke="#3B82F6"
                  strokeWidth={isMobile ? 2 : 4}
                  dot={{ 
                    fill: '#fff', 
                    strokeWidth: isMobile ? 1 : 3, 
                    r: isMobile ? 2 : 5,
                    stroke: '#3B82F6'
                  }}
                  activeDot={{ 
                    r: isMobile ? 3 : 7, 
                    stroke: '#3B82F6', 
                    strokeWidth: isMobile ? 1 : 3, 
                    fill: '#fff'
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Resumo compacto com valores completos */}
          <div className={`${isMobile ? 'mt-2 grid grid-cols-3 gap-1' : 'mt-4 grid grid-cols-3 gap-4'} text-center`}>
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 ${isMobile ? 'p-1' : 'p-4'} rounded-xl border border-blue-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 font-semibold uppercase tracking-wide`}>
                {isMobile ? 'Médio' : 'Custo Médio'}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xl'} font-bold text-blue-700 mt-1 break-words`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(monthlyEvolution.reduce((sum, item) => sum + item.custo, 0) / monthlyEvolution.length, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) :
                  formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </p>
            </div>
            <div className={`bg-gradient-to-br from-green-50 to-emerald-50 ${isMobile ? 'p-1' : 'p-4'} rounded-xl border border-green-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-green-600 font-semibold uppercase tracking-wide`}>
                {isMobile ? 'Maior' : 'Maior Custo'}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xl'} font-bold text-green-700 mt-1 break-words`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(Math.max(...monthlyEvolution.map(item => item.custo)), { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) :
                  formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </p>
            </div>
            <div className={`bg-gradient-to-br from-orange-50 to-yellow-50 ${isMobile ? 'p-1' : 'p-4'} rounded-xl border border-orange-100 shadow-sm`}>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-orange-600 font-semibold uppercase tracking-wide`}>
                {isMobile ? 'Atual' : 'Custo Atual'}
              </p>
              <p className={`${isMobile ? 'text-xs' : 'text-xl'} font-bold text-orange-700 mt-1 break-words`}>
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].custo, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) :
                  formatCurrency(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
