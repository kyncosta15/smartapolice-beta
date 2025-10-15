
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
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Seguradora</CardTitle>
        <CardDescription>
          {hasData ? 'Percentual de apólices por seguradora' : 'Aguardando dados'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{
                  right: 16,
                  left: 0,
                }}
              >
                <CartesianGrid horizontal={false} />
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
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Percentual']}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4}>
                  <LabelList
                    dataKey="insurer"
                    position="insideLeft"
                    offset={8}
                    style={{ fill: 'white' }}
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="value"
                    position="right"
                    offset={8}
                    style={{ fill: 'hsl(var(--foreground))' }}
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground text-sm">Faça upload de PDFs para ver os dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
