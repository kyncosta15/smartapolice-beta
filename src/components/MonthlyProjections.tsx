
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp } from 'lucide-react';
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
      projetado: projection?.projected_cost || totalMonthlyCost,
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

      {/* Gráfico de Projeção */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção Mensal de Custos - {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
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
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 6 }}
                  name="projetado"
                />
                <Line 
                  type="monotone" 
                  dataKey="realizado" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 6 }}
                  name="realizado"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Projeção baseada em {policies.length} apólices ativas</p>
            <p>Custo mensal médio: {formatCurrency(totalMonthlyCost)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
