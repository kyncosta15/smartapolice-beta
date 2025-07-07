
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';

interface StatusEvolutionChartsProps {
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; custo: number; apolices: number }>;
  colors: string[];
}

export function StatusEvolutionCharts({ statusDistribution, monthlyEvolution, colors }: StatusEvolutionChartsProps) {
  
  console.log('📊 StatusEvolutionCharts - Dados recebidos:', {
    statusDistribution: statusDistribution?.length,
    statusData: statusDistribution,
    monthlyEvolution: monthlyEvolution?.length,
    monthlyData: monthlyEvolution,
    colors: colors?.length
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-status-charts">
      <Card className="print-chart-card bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Calendar className="h-5 w-5 mr-2 text-red-600" />
            Status das Apólices
          </CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            Total de {statusDistribution.reduce((sum, item) => sum + item.value, 0)} apólices analisadas
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`status-cell-${entry.name}-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} apólices`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda detalhada */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            {statusDistribution.map((entry, index) => (
              <div key={`legend-${entry.name}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="font-medium">{entry.value} apólices</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="print-chart-card bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Evolução de Custos Mensais
          </CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            Evolução baseada em dados reais das apólices
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolution} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => formatCurrency(value, { showSymbol: false })}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Custo Mensal']} 
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="custo" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Resumo estatístico */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Custo Médio</p>
              <p className="font-semibold text-blue-600">
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(monthlyEvolution.reduce((sum, item) => sum + item.custo, 0) / monthlyEvolution.length) : 
                  formatCurrency(0)
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Maior Custo</p>
              <p className="font-semibold text-green-600">
                {monthlyEvolution.length > 0 ? 
                  formatCurrency(Math.max(...monthlyEvolution.map(item => item.custo))) : 
                  formatCurrency(0)
                }
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Custo Atual</p>
              <p className="font-semibold text-orange-600">
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
