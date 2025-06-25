import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ChartsSectionProps {
  detailed?: boolean;
}

export const ChartsSection = ({ detailed = false }: ChartsSectionProps) => {
  // Dados para gráfico de pizza - Distribuição por Seguradora
  const insurerData = [
    { name: 'Porto Seguro', value: 35, color: '#3B82F6' },
    { name: 'SulAmérica', value: 25, color: '#8B5CF6' },
    { name: 'Bradesco', value: 20, color: '#10B981' },
    { name: 'Allianz', value: 12, color: '#F59E0B' },
    { name: 'Outros', value: 8, color: '#6B7280' }
  ];

  // Dados para gráfico de barras - Custo por mês
  const monthlyData = [
    { month: 'Jan', custo: 125000, apolices: 45 },
    { month: 'Feb', custo: 132000, apolices: 48 },
    { month: 'Mar', custo: 128000, apolices: 46 },
    { month: 'Apr', custo: 135000, apolices: 52 },
    { month: 'May', custo: 142000, apolices: 55 },
    { month: 'Jun', custo: 138000, apolices: 53 }
  ];

  // Dados para distribuição por tipo de seguro
  const typeData = [
    { name: 'Seguro Auto', value: 40, color: '#3B82F6' },
    { name: 'Vida/Saúde', value: 30, color: '#10B981' },
    { name: 'Patrimonial', value: 20, color: '#F59E0B' },
    { name: 'Empresarial', value: 10, color: '#8B5CF6' }
  ];

  // Dados para timeline de vencimentos
  const expirationData = [
    { month: 'Jul', vencimentos: 12 },
    { month: 'Ago', vencimentos: 18 },
    { month: 'Set', vencimentos: 8 },
    { month: 'Out', vencimentos: 15 },
    { month: 'Nov', vencimentos: 22 },
    { month: 'Dez', vencimentos: 10 }
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full space-y-6 max-w-full overflow-hidden">
      {/* Single column layout for full-width charts */}
      <div className="flex flex-col space-y-6">
        {/* Distribuição por Seguradora */}
        <Card className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Distribuição por Seguradora</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insurerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius="45%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {insurerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {insurerData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 text-sm font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo de Seguro */}
        <Card className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Tipos de Seguro</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius="25%"
                    outerRadius="45%"
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomLabel}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {typeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolução de Custos */}
        <Card className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Evolução de Custos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Custo']}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="custo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Vencimentos */}
        <Card className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Timeline de Vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expirationData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'Vencimentos']}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vencimentos" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {detailed && (
          <Card className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Análise Comparativa - Custo vs Número de Apólices</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'custo' ? `R$ ${value.toLocaleString('pt-BR')}` : value,
                        name === 'custo' ? 'Custo Total' : 'Nº de Apólices'
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar yAxisId="left" dataKey="custo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="apolices" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};
