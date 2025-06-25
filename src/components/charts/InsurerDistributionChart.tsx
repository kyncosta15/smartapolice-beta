
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Convert insurer data to line chart format
const insurerLineData = [
  { month: 'Jan', 'Porto Seguro': 35, 'SulAmérica': 25, 'Bradesco': 20, 'Allianz': 12, 'Outros': 8 },
  { month: 'Fev', 'Porto Seguro': 37, 'SulAmérica': 24, 'Bradesco': 19, 'Allianz': 13, 'Outros': 7 },
  { month: 'Mar', 'Porto Seguro': 36, 'SulAmérica': 26, 'Bradesco': 18, 'Allianz': 12, 'Outros': 8 },
  { month: 'Abr', 'Porto Seguro': 38, 'SulAmérica': 23, 'Bradesco': 21, 'Allianz': 11, 'Outros': 7 },
  { month: 'Mai', 'Porto Seguro': 35, 'SulAmérica': 27, 'Bradesco': 19, 'Allianz': 12, 'Outros': 7 },
  { month: 'Jun', 'Porto Seguro': 34, 'SulAmérica': 25, 'Bradesco': 22, 'Allianz': 12, 'Outros': 7 }
];

export const InsurerDistributionChart = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Tendência de Participação por Seguradora</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={insurerLineData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
              <Line type="monotone" dataKey="Porto Seguro" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="SulAmérica" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Bradesco" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Allianz" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Outros" stroke="#6B7280" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
