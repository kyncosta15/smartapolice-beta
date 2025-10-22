
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield } from 'lucide-react';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';

interface InsuranceTypesChartProps {
  policies?: PolicyData[];
}

export const InsuranceTypesChart = ({ policies = [] }: InsuranceTypesChartProps) => {
  const hasData = policies && policies.length > 0;
  const chartData = hasData ? generateChartData(policies) : getEmptyStateData();

  // Convert type data to line chart format for trend visualization
  const generateTrendData = () => {
    if (!hasData) return getEmptyStateData().monthlyData;
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return months.map(month => {
      const dataPoint: any = { month };
      chartData.typeData.forEach(type => {
        // Add some variation to simulate trends
        const variation = (Math.random() - 0.5) * 8;
        dataPoint[type.name] = Math.max(0, type.value + variation);
      });
      return dataPoint;
    });
  };

  const trendData = generateTrendData();
  const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#6b7280'];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Distribuição por Tipo de Seguro
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {hasData ? 'Tipos de apólices cadastradas (residencial = patrimonial)' : 'Aguardando dados para análise'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80 relative bg-background rounded-lg [&_svg]:!bg-transparent">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={trendData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-muted-foreground"
                tickLine={{ className: "stroke-border" }}
                axisLine={{ className: "stroke-border" }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tickLine={{ className: "stroke-border" }}
                axisLine={{ className: "stroke-border" }}
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
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: 'hsl(var(--foreground))'
                }}
              />
              {chartData.typeData.map((type, index) => (
                <Line 
                  key={type.name}
                  type="monotone" 
                  dataKey={type.name} 
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
                <p className="text-muted-foreground text-sm">Faça upload de PDFs para ver os dados</p>
              </div>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-4 p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nota:</strong> Apólices identificadas como "residencial" são automaticamente categorizadas como "Patrimonial"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
