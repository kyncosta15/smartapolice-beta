
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2 } from 'lucide-react';
import { PolicyData, generateChartData, getEmptyStateData } from './chartData';

interface InsurerDistributionChartProps {
  policies?: PolicyData[];
}

export const InsurerDistributionChart = ({ policies = [] }: InsurerDistributionChartProps) => {
  const hasData = policies && policies.length > 0;
  const chartData = hasData ? generateChartData(policies) : getEmptyStateData();

  // Cores específicas para seguradoras com gradientes
  const insurerColors = {
    'Porto Seguro': '#e11d48', // Vermelho
    'Bradesco': '#dc2626',     // Vermelho escuro
    'Allianz': '#2563eb',      // Azul
    'Zurich': '#1d4ed8',       // Azul escuro
    'SulAmérica': '#059669',   // Verde
    'Mapfre': '#10b981',       // Verde claro
    'Tokio Marine': '#7c3aed', // Roxo
    'HDI': '#8b5cf6',          // Roxo claro
    'Darwin Seguros S.A.': '#f59e0b', // Laranja
    'HDI SEGUROS S.A.': '#8b5cf6',    // Roxo claro
    'Liberty': '#f59e0b',      // Laranja
    'AXA': '#d97706',          // Laranja escuro
    'Generali': '#06b6d4',     // Ciano
    'Outros': '#6b7280'        // Cinza
  };

  // Função para obter cor da seguradora
  const getInsurerColor = (insurerName: string) => {
    return insurerColors[insurerName as keyof typeof insurerColors] || insurerColors['Outros'];
  };

  // Preparar dados para o gráfico de barras
  const barChartData = chartData.insurerData.map(insurer => ({
    name: insurer.name,
    value: insurer.value,
    color: getInsurerColor(insurer.name)
  }));

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl shadow-sm">
            <Building2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
              Distribuição por Seguradora
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
            <BarChart 
              data={barChartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              {/* Gradiente para o fundo do gráfico */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99, 102, 241, 0.1)" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0.02)" />
                </linearGradient>
                {barChartData.map((insurer, index) => (
                  <linearGradient key={insurer.name} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={insurer.color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={insurer.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(148, 163, 184, 0.3)" 
                strokeWidth={1}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                tickLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                label={{ 
                  value: '%', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b', fontWeight: 600 }
                }}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Participação']}
                labelFormatter={(label) => `Seguradora: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                  backdropFilter: 'blur(8px)'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#chartGradient)"
                radius={[4, 4, 0, 0]}
              >
                {barChartData.map((entry, index) => (
                  <Bar key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm">
                <p className="text-gray-400 text-sm font-medium">Faça upload de PDFs para ver os dados</p>
              </div>
            </div>
          )}
        </div>

        {/* Legenda com cores das seguradoras */}
        {hasData && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Seguradoras</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {chartData.insurerData.map((insurer) => (
                <div key={insurer.name} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${getInsurerColor(insurer.name)}, ${getInsurerColor(insurer.name)}cc)`
                    }}
                  />
                  <span className="text-xs font-medium text-gray-600 truncate">
                    {insurer.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {insurer.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
