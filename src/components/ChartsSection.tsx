
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Distribuição por Seguradora */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Distribuição por Seguradora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={insurerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            {insurerData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Evolução de Custos */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Evolução de Custos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Custo']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar dataKey="custo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Pizza - Distribuição por Tipo */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Seguro</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={100}
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
          <div className="mt-4 space-y-2">
            {typeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Vencimentos */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Timeline de Vencimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={expirationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}`, 'Vencimentos']}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="vencimentos" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Gráfico adicional para versão detalhada */}
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle>Análise Comparativa - Custo vs Número de Apólices</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'custo' ? `R$ ${value.toLocaleString('pt-BR')}` : value,
                      name === 'custo' ? 'Custo Total' : 'Nº de Apólices'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar yAxisId="left" dataKey="custo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="apolices" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
