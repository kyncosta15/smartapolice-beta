
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyData = [
  { month: 'Jan', custo: 125000, apolices: 45 },
  { month: 'Fev', custo: 132000, apolices: 48 },
  { month: 'Mar', custo: 128000, apolices: 46 },
  { month: 'Abr', custo: 135000, apolices: 52 },
  { month: 'Mai', custo: 142000, apolices: 55 },
  { month: 'Jun', custo: 138000, apolices: 53 }
];

export const ComparativeAnalysisChart = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Tendência Comparativa - Custo vs Número de Apólices</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="custo" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="apolices" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
