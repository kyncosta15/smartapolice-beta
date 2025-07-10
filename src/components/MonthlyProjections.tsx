
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonthlyProjections } from '@/hooks/useMonthlyProjections';
import { formatCurrency } from '@/utils/currencyFormatter';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface MonthlyProjectionsProps {
  policies: ParsedPolicyData[];
}

export function MonthlyProjections({ policies }: MonthlyProjectionsProps) {
  const { projections, isLoading, generateProjections } = useMonthlyProjections();

  const totalMonthlyCost = policies.reduce((sum, policy) => 
    sum + (policy.monthlyAmount || 0), 0
  );

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const chartData = monthNames.map((month, index) => {
    const projection = projections.find(p => p.month === index + 1);
    return {
      month,
      projetado: projection?.projected_cost || 0,
      realizado: projection?.actual_cost || 0
    };
  });

  const handleGenerateProjections = () => {
    generateProjections(totalMonthlyCost);
  };

  useEffect(() => {
    // Gerar projeções automaticamente quando houver apólices
    if (policies.length > 0 && projections.length === 0) {
      generateProjections(totalMonthlyCost);
    }
  }, [policies.length, projections.length, totalMonthlyCost]);

  const currentYear = new Date().getFullYear();
  const totalProjected = projections.reduce((sum, p) => sum + p.projected_cost, 0);
  const totalActual = projections.reduce((sum, p) => sum + p.actual_cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Projeção Anual {currentYear}</h2>
        </div>
        <Button 
          onClick={handleGenerateProjections}
          disabled={isLoading || policies.length === 0}
          className="flex items-center space-x-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Atualizar Projeções</span>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projetado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalProjected)}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo total estimado para {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensal Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em {policies.length} apólices ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalActual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Custos já realizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Projeção */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção vs Realizado - {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value, { compact: true })} />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)), 
                    name === 'projetado' ? 'Projetado' : 'Realizado'
                  ]} 
                />
                <Line 
                  type="monotone" 
                  dataKey="projetado" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                  name="projetado"
                />
                <Line 
                  type="monotone" 
                  dataKey="realizado" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                  name="realizado"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">Projetado</th>
                  <th className="text-right p-2">Realizado</th>
                  <th className="text-right p-2">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => {
                  const diff = row.realizado - row.projetado;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{row.month}</td>
                      <td className="p-2 text-right text-blue-600">
                        {formatCurrency(row.projetado)}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        {formatCurrency(row.realizado)}
                      </td>
                      <td className={`p-2 text-right ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Math.abs(diff))}
                        {diff !== 0 && (diff >= 0 ? ' ↑' : ' ↓')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
