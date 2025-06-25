
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Convert insurance types data to line chart format
const typeLineData = [
  { month: 'Jan', 'Seguro Auto': 40, 'Vida/Saúde': 30, 'Patrimonial': 20, 'Empresarial': 10 },
  { month: 'Fev', 'Seguro Auto': 42, 'Vida/Saúde': 28, 'Patrimonial': 21, 'Empresarial': 9 },
  { month: 'Mar', 'Seguro Auto': 39, 'Vida/Saúde': 32, 'Patrimonial': 19, 'Empresarial': 10 },
  { month: 'Abr', 'Seguro Auto': 41, 'Vida/Saúde': 29, 'Patrimonial': 22, 'Empresarial': 8 },
  { month: 'Mai', 'Seguro Auto': 38, 'Vida/Saúde': 33, 'Patrimonial': 18, 'Empresarial': 11 },
  { month: 'Jun', 'Seguro Auto': 40, 'Vida/Saúde': 31, 'Patrimonial': 20, 'Empresarial': 9 }
];

export const InsuranceTypesChart = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Tendência de Tipos de Seguro</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={typeLineData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value}%`, name]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="Seguro Auto" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Vida/Saúde" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Patrimonial" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Empresarial" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
