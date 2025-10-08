import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AdminMetrics } from '@/types/admin';

interface AdminChartsProps {
  metrics: AdminMetrics | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Distribuição por Seguradora */}
      <Card>
        <CardHeader>
          <CardTitle>Apólices por Seguradora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={seguradoras}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {seguradoras.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Veículos por Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Veículos por Empresa (Top 8)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={veiculosEmpresas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="veiculos" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sinistros vs Assistências */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Totais</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Médias por Período */}
      <Card>
        <CardHeader>
          <CardTitle>Média Diária de Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mediasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sinistros" fill="hsl(var(--primary))" name="Sinistros" />
              <Bar dataKey="assistencias" fill="hsl(var(--secondary))" name="Assistências" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
