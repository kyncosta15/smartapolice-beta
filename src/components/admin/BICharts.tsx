import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { BIMetrics } from '@/hooks/useCorpNuvemBIMetrics';
import { Skeleton } from '@/components/ui/skeleton';

interface BIChartsProps {
  metrics: BIMetrics | null;
  loading: boolean;
}

// Cores para os gráficos
const COLORS = [
  '#0052A3', // Azul escuro
  '#0078D4', // Azul claro
  '#10b981', // Verde
  '#f59e0b', // Laranja
  '#ec4899', // Rosa
  '#8b5cf6', // Roxo
  '#06b6d4', // Ciano
  '#ef4444', // Vermelho
  '#84cc16', // Lima
  '#6366f1', // Indigo
];

// Cores para o gráfico de produtores
const PRODUCER_COLORS = {
  novos: '#0078D4',
  renovacoes: '#10b981',
  faturas: '#E5E7EB',
  endossos: '#9CA3AF'
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4 px-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-foreground font-medium truncate" title={entry.value}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Label customizado para o gráfico de pizza
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percentage }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Só mostra label se a porcentagem for maior que 2%
  if (percentage < 2) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-[10px] font-semibold"
    >
      {`${name}: ${percentage.toFixed(1)}%`}
    </text>
  );
};

export function BICharts({ metrics, loading }: BIChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="pb-4">
              <Skeleton className="h-[400px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
      {/* Gráfico de Seguradoras */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Seguradoras</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {metrics.seguradoras.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={metrics.seguradoras.slice(0, 10)}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={(props) => <CustomLabel {...props} />}
                  outerRadius={window.innerWidth < 768 ? 80 : 110}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {metrics.seguradoras.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                />
                <Legend 
                  content={<CustomLegend />}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Ramos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Ramos</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {metrics.ramos.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={metrics.ramos.slice(0, 10)}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={(props) => <CustomLabel {...props} />}
                  outerRadius={window.innerWidth < 768 ? 80 : 110}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {metrics.ramos.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                />
                <Legend 
                  content={<CustomLegend />}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Produtores - ocupa 2 colunas */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Produtores</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {metrics.produtores.length === 0 ? (
            <div className="h-[450px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart 
                data={metrics.produtores} 
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={180}
                  fontSize={11}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.length > 25 ? value.substring(0, 25) + '...' : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '10px'
                  }}
                  cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
                />
                <Legend 
                  content={<CustomLegend />}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '15px' }}
                />
                <Bar dataKey="novos" name="Novos" fill={PRODUCER_COLORS.novos} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="renovacoes" name="Renovações" fill={PRODUCER_COLORS.renovacoes} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="faturas" name="Faturas" fill={PRODUCER_COLORS.faturas} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="endossos" name="Endossos" fill={PRODUCER_COLORS.endossos} stackId="a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
