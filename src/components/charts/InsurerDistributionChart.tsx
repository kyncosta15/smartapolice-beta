
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2 } from 'lucide-react';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';

interface InsurerDistributionChartProps {
  policies?: PolicyData[];
}

export const InsurerDistributionChart = ({ policies = [] }: InsurerDistributionChartProps) => {
  const hasData = policies && policies.length > 0;
  const chartData = hasData ? generateChartData(policies) : getEmptyStateData();

  // Convert insurer data to line chart format for trend visualization
  const generateTrendData = () => {
    if (!hasData) return getEmptyStateData().monthlyData;
    
    // Simulate trend data based on current distribution
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map(month => {
      const dataPoint: any = { month };
      chartData.insurerData.forEach(insurer => {
        // Add some variation to simulate trends
        const variation = (Math.random() - 0.5) * 6;
        dataPoint[insurer.name] = Math.max(0, insurer.value + variation);
      });
      return dataPoint;
    });
  };

  const trendData = generateTrendData();
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#6b7280'];

  return (
    <Card className="bg-white border-0 shadow-none">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Participação por Seguradora
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {hasData ? 'Distribuição de apólices entre seguradoras' : 'Aguardando dados para análise'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={trendData} 
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
                label={{ 
                  value: '%', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b' }
                }}
              />
              <Tooltip 
                formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              {chartData.insurerData.map((insurer, index) => (
                <Line 
                  key={insurer.name}
                  type="monotone" 
                  dataKey={insurer.name} 
                  stroke={hasData ? colors[index % colors.length] : '#e2e8f0'}
                  strokeWidth={2.5} 
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ 
                    r: 6, 
                    strokeWidth: 2,
                    fill: '#fff'
                  }}
                />
              ))}
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
      </CardContent>
    </Card>
  );
};
