
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';

interface ExpirationTimelineChartProps {
  policies?: PolicyData[];
}

export const ExpirationTimelineChart = ({ policies = [] }: ExpirationTimelineChartProps) => {
  const hasData = policies && policies.length > 0;
  const chartData = hasData ? generateChartData(policies) : getEmptyStateData();

  return (
    <Card className="bg-white border-0 shadow-none">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Calendar className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Cronograma de Vencimentos
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {hasData ? 'Apólices com vencimento nos próximos meses' : 'Aguardando dados para análise'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData.expirationData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
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
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [`${value}`, 'Vencimentos']}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="vencimentos" 
                stroke={hasData ? "#ea580c" : "#e2e8f0"}
                strokeWidth={3}
                dot={{ 
                  fill: hasData ? "#ea580c" : "#e2e8f0", 
                  strokeWidth: 2, 
                  r: 5 
                }}
                activeDot={{ 
                  r: 7, 
                  stroke: hasData ? "#ea580c" : "#e2e8f0", 
                  strokeWidth: 2,
                  fill: '#fff'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Faça upload de PDFs para ver os dados</p>
              </div>
            </div>
          )}
        </div>

        {hasData && chartData.expirationData.some(item => item.vencimentos > 0) && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-700 font-medium">
                Atenção: Há apólices com vencimento próximo
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
