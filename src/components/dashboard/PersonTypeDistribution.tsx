
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PersonTypeDistributionProps {
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
}

export function PersonTypeDistribution({ personTypeDistribution }: PersonTypeDistributionProps) {
  const total = personTypeDistribution.pessoaFisica + personTypeDistribution.pessoaJuridica;
  
  const chartData = [
    {
      name: 'Pessoa Física',
      value: personTypeDistribution.pessoaFisica,
      color: '#3B82F6',
      icon: User
    },
    {
      name: 'Pessoa Jurídica', 
      value: personTypeDistribution.pessoaJuridica,
      color: '#10B981',
      icon: Building2
    }
  ];

  const hasData = total > 0;

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Distribuição por Vínculo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} apólice${value !== 1 ? 's' : ''}`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Cards de Resumo */}
            <div className="flex flex-col justify-center space-y-4">
              {chartData.map((item) => {
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                const IconComponent = item.icon;
                
                return (
                  <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                        <IconComponent className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{percentage}% do total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: item.color }}>
                        {item.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        apólice{item.value !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum dado de vínculo disponível</p>
            <p className="text-sm text-gray-400 mt-1">
              Faça upload de apólices para ver a distribuição por pessoa física/jurídica
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
