
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';

interface ComparativeAnalysisChartProps {
  policies?: PolicyData[];
}

export const ComparativeAnalysisChart = ({ policies = [] }: ComparativeAnalysisChartProps) => {
  const hasData = policies && policies.length > 0;
  const chartData = hasData ? generateChartData(policies) : getEmptyStateData();

  return (
    <Card className="bg-white border-0 shadow-none">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Análise Comparativa - Custo vs Volume
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {hasData ? 'Relação entre custos totais e número de apólices' : 'Aguardando dados para análise'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-96 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData.monthlyData} 
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
                yAxisId="left" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#e2e8f0' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => hasData ? `${(value / 1000).toFixed(0)}K` : '0'}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={{ stroke: '#e2e8f0' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'custo' 
                    ? `R$ ${Number(value).toLocaleString('pt-BR')}` 
                    : value,
                  name === 'custo' ? 'Custo Total' : 'Nº de Apólices'
                ]}
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
                yAxisId="left" 
                type="monotone" 
                dataKey="custo" 
                stroke={hasData ? "#2563eb" : "#e2e8f0"}
                strokeWidth={3}
                dot={{ 
                  fill: hasData ? "#2563eb" : "#e2e8f0", 
                  strokeWidth: 2, 
                  r: 5 
                }}
                name="custo"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="apolices" 
                stroke={hasData ? "#059669" : "#e2e8f0"}
                strokeWidth={3}
                dot={{ 
                  fill: hasData ? "#059669" : "#e2e8f0", 
                  strokeWidth: 2, 
                  r: 5 
                }}
                name="apolices"
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
      </CardContent>
    </Card>
  );
};
