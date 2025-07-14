
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface StatusEvolutionChartsProps {
  statusDistribution: Array<{ name: string; value: number }>;
  monthlyEvolution: Array<{ month: string; cost: number }>;
  colors: string[];
}

export function StatusEvolutionCharts({ statusDistribution, monthlyEvolution, colors }: StatusEvolutionChartsProps) {
  const hasStatusData = statusDistribution.some(item => item.value > 0);
  const hasEvolutionData = monthlyEvolution.some(item => item.cost > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Status das Apólices */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Status das Apólices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasStatusData ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} apólice${value !== 1 ? 's' : ''}`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Nenhum dado de status disponível</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Evolução Mensal */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Evolução de Custos (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasEvolutionData ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Nenhum dado de evolução disponível</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
