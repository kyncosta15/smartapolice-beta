
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';
import { renderValueAsString } from '@/utils/renderValue';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

interface InsurerDistributionChartProps {
  policies?: PolicyData[];
}

// Cores específicas por seguradora
const insurerColors: Record<string, string> = {
  'PORTO SEGURO': '#0050B3',
  'PORTO': '#0050B3',
  'BRADESCO': '#00B96B',
  'BRADESCO AUTO/RE': '#00B96B',
  'MAPFRE': '#E31837',
  'TOKIO MARINE': '#003C71',
  'SUHAI': '#FF6B00',
  'ALLIANZ': '#003781',
  'LIBERTY': '#00529B',
  'AZUL': '#0066CC',
  'HDI': '#009639',
  'SOMPO': '#E4002B',
};

const getInsurerColor = (name: string, isHighest: boolean): string => {
  const upperName = name.toUpperCase();
  
  // Procura cor específica da seguradora
  for (const [key, color] of Object.entries(insurerColors)) {
    if (upperName.includes(key)) {
      return color;
    }
  }
  
  // Se for o maior valor, usa azul primário; senão, cinza neutro
  return isHighest ? '#0050B3' : '#CBD5E1';
};

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

  // Prepare data for horizontal bar chart - sorted by value descending
  const barChartData = chartData.insurerData
    .sort((a, b) => b.value - a.value)
    .map(insurer => ({
      insurer: insurer.name,
      value: Number(insurer.value.toFixed(2))
    }));

  // Identificar o maior valor
  const maxValue = barChartData.length > 0 ? barChartData[0].value : 0;

  // Chart configuration
  const chartConfig = {
    value: {
      label: "Valor",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-border/50 px-4 py-3">
          <p className="font-semibold text-foreground text-sm mb-1">{data.insurer}</p>
          <p className="text-primary font-bold text-base">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calcular altura dinâmica baseada na quantidade de barras
  const chartHeight = Math.max(180, barChartData.length * 50);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Distribuição por Seguradora</CardTitle>
        <CardDescription>
          {hasData ? 'Valor mensal por seguradora' : 'Aguardando dados'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="bg-background rounded-xl p-4">
            <ChartContainer config={chartConfig} className={`w-full`} style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: 140,
                    left: 8,
                    bottom: 8,
                  }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid 
                    horizontal={false} 
                    vertical={true}
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--muted-foreground) / 0.15)" 
                  />
                  <YAxis
                    dataKey="insurer"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    hide
                  />
                  <XAxis 
                    dataKey="value" 
                    type="number" 
                    hide 
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 4, 4]}
                    maxBarSize={32}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getInsurerColor(entry.insurer, entry.value === maxValue)}
                      />
                    ))}
                    <LabelList
                      dataKey="insurer"
                      content={({ x, y, width, height, value }) => {
                        const barWidth = Number(width) || 0;
                        const textLength = String(value).length;
                        const minBarWidth = textLength * 9 + 32;
                        const isInsideBar = barWidth >= minBarWidth;
                        
                        return (
                          <text
                            x={isInsideBar ? Number(x) + 12 : Number(x) + barWidth + 12}
                            y={Number(y) + Number(height) / 2}
                            fill={isInsideBar ? '#FFFFFF' : 'hsl(var(--foreground))'}
                            fontSize={14}
                            fontWeight={600}
                            dominantBaseline="middle"
                            textAnchor="start"
                            style={{ fontFamily: 'Inter, Roboto, sans-serif' }}
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={12}
                      fontSize={14}
                      fontWeight={600}
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      fill="hsl(var(--foreground))"
                      style={{ fontFamily: 'Inter, Roboto, sans-serif' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[180px]">
            <p className="text-muted-foreground text-sm">Faça upload de PDFs para ver os dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
