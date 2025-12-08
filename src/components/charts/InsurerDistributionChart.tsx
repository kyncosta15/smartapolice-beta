
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';
import { renderValueAsString } from '@/utils/renderValue';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

interface InsurerDistributionChartProps {
  policies?: PolicyData[];
}

export const InsurerDistributionChart = ({ policies = [] }: InsurerDistributionChartProps) => {
  const hasData = policies && policies.length > 0;
  const rawChartData = hasData ? generateChartData(policies) : getEmptyStateData();
  
  // Safely extract insurer names from potentially complex N8N objects
  const chartData = {
    ...rawChartData,
    insurerData: rawChartData.insurerData.map(insurer => ({
      ...insurer,
      name: renderValueAsString(insurer.name)
    }))
  };

  // Prepare data for horizontal bar chart
  const barChartData = chartData.insurerData
    .sort((a, b) => b.value - a.value)
    .map(insurer => ({
      insurer: insurer.name,
      value: Number(insurer.value.toFixed(1))
    }));

  // Chart configuration
  const chartConfig = {
    value: {
      label: "Percentual",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Distribuição por Seguradora</CardTitle>
        <CardDescription>
          {hasData ? 'Percentual de apólices por seguradora' : 'Aguardando dados'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="chart-root bg-background rounded-2xl p-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%" className="!bg-transparent">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{
                    right: 120,
                    left: 10,
                  }}
                >
                  <CartesianGrid 
                    horizontal={false} 
                    stroke="hsl(var(--muted-foreground) / 0.25)" 
                  />
                  <YAxis
                    dataKey="insurer"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    hide
                  />
                  <XAxis dataKey="value" type="number" hide />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4}>
                    <LabelList
                      dataKey="insurer"
                      content={({ x, y, width, height, value }) => {
                        const barWidth = Number(width) || 0;
                        const textLength = String(value).length;
                        const minBarWidth = textLength * 8 + 24;
                        const isInsideBar = barWidth >= minBarWidth;
                        
                        return (
                          <text
                            x={isInsideBar ? Number(x) + 10 : Number(x) + barWidth + 10}
                            y={Number(y) + Number(height) / 2}
                            fill={isInsideBar ? 'white' : 'hsl(221, 39%, 11%)'}
                            fontSize={11}
                            fontWeight={600}
                            dominantBaseline="middle"
                            textAnchor="start"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={10}
                      fontSize={11}
                      fontWeight={500}
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                      fill="hsl(221, 39%, 11%)"
                    />
                  </Bar>
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground text-sm">Faça upload de PDFs para ver os dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
