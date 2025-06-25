
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthlyData } from './chartData';

export const ComparativeAnalysisChart = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Análise Comparativa - Custo vs Número de Apólices</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'custo' ? `R$ ${value.toLocaleString('pt-BR')}` : value,
                  name === 'custo' ? 'Custo Total' : 'Nº de Apólices'
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar yAxisId="left" dataKey="custo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="apolices" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
