import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTicketsData } from '@/hooks/useTicketsData';

const COLORS = {
  sinistro: '#ef4444', // red-500
  assistencia: '#3b82f6', // blue-500
  colisao: '#dc2626', // red-600
  roubo: '#991b1b', // red-800
  furto: '#b91c1c', // red-700
  avaria: '#f97316', // orange-500
  incendio: '#ea580c', // orange-600
  danos_terceiros: '#fb923c', // orange-400
  guincho: '#2563eb', // blue-600
  vidro: '#1d4ed8', // blue-700
  mecanica: '#1e40af', // blue-800
  chaveiro: '#60a5fa', // blue-400
  pneu: '#93c5fd', // blue-300
  combustivel: '#dbeafe', // blue-100
  residencia: '#3730a3', // indigo-700
};

export function TicketsCharts() {
  const { chartData, loading, setFilters } = useTicketsData();

  const handleSubtipoClick = (data: any) => {
    setFilters(prev => ({ ...prev, subtipo: data.name }));
  };

  const handleMesClick = (data: any) => {
    // Aqui você pode implementar filtro por mês se necessário
    console.log('Clicked mes:', data);
  };

  const handleCategoriaClick = (data: any) => {
    setFilters(prev => ({ ...prev, categoria: data.categoria }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Análise e Relatórios
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Subtipo */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Distribuição por Tipo
          </h3>
          {chartData.subtipos.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.subtipos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handleSubtipoClick}
                  className="cursor-pointer"
                >
                  {chartData.subtipos.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || COLORS[entry.tipo]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Nenhum dado disponível
            </div>
          )}
        </Card>

        {/* Tickets por Mês */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Tickets por Mês
          </h3>
          {chartData.porMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.porMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="sinistros" 
                  fill={COLORS.sinistro} 
                  name="Sinistros"
                  onClick={handleMesClick}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="assistencias" 
                  fill={COLORS.assistencia} 
                  name="Assistências"
                  onClick={handleMesClick}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Nenhum dado disponível
            </div>
          )}
        </Card>

        {/* Por Categoria de Veículo */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Por Categoria de Veículo
          </h3>
          {chartData.porCategoria.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.porCategoria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }: any) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                  onClick={handleCategoriaClick}
                  className="cursor-pointer"
                >
                  {chartData.porCategoria.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}