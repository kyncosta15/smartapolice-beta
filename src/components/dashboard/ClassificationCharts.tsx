
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, ShoppingCart, Calendar } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ClassificationChartsProps {
  typeDistribution: Array<{ name: string; value: number; color: string }>;
  insurerDistribution: Array<{ name: string; value: number; color: string }>;
  recentPolicies: Array<{
    name: string;
    insurer: string;
    value: number;
    dueDate?: string;
    insertDate?: string;
    type?: string;
    status?: string;
  }>;
  colors: string[];
}

export function ClassificationCharts({ 
  typeDistribution, 
  insurerDistribution, 
  recentPolicies,
  colors 
}: ClassificationChartsProps) {
  const hasTypeData = typeDistribution.some(item => item.value > 0);
  const hasInsurerData = insurerDistribution.some(item => item.value > 0);
  const hasRecentData = recentPolicies.length > 0;

  return (
    <div className="space-y-6">
      {/* Linha 1: Gráficos de Tipo e Seguradora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTypeData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `R$ ${value.toFixed(2)}`,
                        name
                      ]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhum dado de tipo disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Seguradora */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Distribuição por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasInsurerData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insurerDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value} apólice${value !== 1 ? 's' : ''}`,
                        'Quantidade'
                      ]}
                    />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhum dado de seguradora disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Apólices Recentes */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Apólices Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasRecentData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900">Apólice</th>
                    <th className="text-left py-2 font-medium text-gray-900">Seguradora</th>
                    <th className="text-left py-2 font-medium text-gray-900">Tipo</th>
                    <th className="text-left py-2 font-medium text-gray-900">Valor Mensal</th>
                    <th className="text-left py-2 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPolicies.slice(0, 5).map((policy, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{policy.name}</td>
                      <td className="py-3 text-gray-600">{policy.insurer}</td>
                      <td className="py-3 text-gray-600">{policy.type}</td>
                      <td className="py-3 text-gray-900 font-medium">
                        R$ {policy.value.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          policy.status === 'Ativa' ? 'bg-green-100 text-green-800' :
                          policy.status === 'Vencida' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {policy.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Nenhuma apólice recente disponível</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
