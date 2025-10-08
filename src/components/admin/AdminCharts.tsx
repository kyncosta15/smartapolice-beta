import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AdminMetrics } from '@/types/admin';

interface AdminChartsProps {
  metrics: AdminMetrics | null;
}

// Cores distintas e vibrantes para melhor visualização
const COLORS = [
  '#3b82f6', // Azul vibrante
  '#10b981', // Verde esmeralda
  '#f59e0b', // Laranja
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#ef4444', // Vermelho
  '#84cc16', // Lima
];

// Componente de legenda customizada com bolinhas coloridas
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function AdminCharts({ metrics }: AdminChartsProps) {
  if (!metrics) return null;

  // Preparar dados para o gráfico de seguradoras
  const seguradoras = metrics.apolices_por_seguradora
    .slice(0, 8)
    .map(item => ({
      name: item.seguradora || 'Sem seguradora',
      value: item.total
    }));

  // Preparar dados para o gráfico de veículos por empresa
  const veiculosEmpresas = metrics.veiculos_por_empresa
    .slice(0, 8)
    .map(item => ({
      name: item.empresa_nome.length > 30 
        ? item.empresa_nome.substring(0, 30) + '...' 
        : item.empresa_nome,
      veiculos: item.total_veiculos
    }));

  // Dados de sinistros e assistências
  const ticketsData = [
    { name: 'Sinistros', total: metrics.sinistros_total },
    { name: 'Assistências', total: metrics.assistencias_total }
  ];

  // Dados de médias 30/60 dias
  const mediasData = [
    { 
      periodo: '30 dias', 
      sinistros: Number(metrics.medias_30.sinistros.toFixed(1)),
      assistencias: Number(metrics.medias_30.assistencias.toFixed(1))
    },
    { 
      periodo: '60 dias', 
      sinistros: Number(metrics.medias_60.sinistros.toFixed(1)),
      assistencias: Number(metrics.medias_60.assistencias.toFixed(1))
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
      {/* Distribuição por Seguradora */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Apólices por Seguradora</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={seguradoras}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={false}
                outerRadius={window.innerWidth < 768 ? 60 : 80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {seguradoras.map((entry, index) => (
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
                formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Veículos por Empresa */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Veículos por Empresa (Top 8)</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={veiculosEmpresas} margin={{ bottom: window.innerWidth < 768 ? 80 : 70, left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={window.innerWidth < 768 ? 100 : 80}
                fontSize={window.innerWidth < 768 ? 9 : 10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
              />
              <YAxis 
                fontSize={11}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={window.innerWidth < 768 ? 30 : 40}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px'
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              />
              <Bar dataKey="veiculos" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sinistros vs Assistências */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Tickets Totais</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ticketsData} margin={{ left: 0, right: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                fontSize={window.innerWidth < 768 ? 11 : 12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={11}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={window.innerWidth < 768 ? 35 : 45}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px'
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              />
              <Bar dataKey="total" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Médias por Período */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Média Diária de Tickets</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mediasData} margin={{ left: 0, right: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="periodo" 
                fontSize={window.innerWidth < 768 ? 11 : 12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={11}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={window.innerWidth < 768 ? 35 : 45}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px'
                }}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              />
              <Legend 
                content={<CustomLegend />}
                iconType="circle"
              />
              <Bar dataKey="sinistros" fill="#ef4444" name="Sinistros" radius={[6, 6, 0, 0]} />
              <Bar dataKey="assistencias" fill="#f59e0b" name="Assistências" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
