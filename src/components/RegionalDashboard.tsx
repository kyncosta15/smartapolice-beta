
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, TrendingUp, Users, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RegionalDashboardProps {
  policies: any[];
}

export function RegionalDashboard({ policies }: RegionalDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  // Dados simulados para cidades e regiões
  const citiesData = [
    { name: 'São Paulo', value: 45, policies: 245, amount: 1250000 },
    { name: 'Rio de Janeiro', value: 25, policies: 135, amount: 680000 },
    { name: 'Belo Horizonte', value: 15, policies: 80, amount: 420000 },
    { name: 'Brasília', value: 10, policies: 55, amount: 290000 },
    { name: 'Outros', value: 5, policies: 25, amount: 130000 }
  ];

  const regionsData = [
    { name: 'Sudeste', value: 60, growth: 12.5, color: '#3B82F6' },
    { name: 'Sul', value: 18, growth: 8.2, color: '#10B981' },
    { name: 'Nordeste', value: 12, growth: 15.8, color: '#F59E0B' },
    { name: 'Centro-Oeste', value: 7, growth: 5.4, color: '#8B5CF6' },
    { name: 'Norte', value: 3, growth: 22.1, color: '#EF4444' }
  ];

  const statesPerformance = [
    { state: 'SP', policies: 245, revenue: 1250000, growth: 12.5 },
    { state: 'RJ', policies: 135, revenue: 680000, growth: 8.7 },
    { state: 'MG', policies: 80, revenue: 420000, growth: 15.2 },
    { state: 'RS', policies: 65, revenue: 340000, growth: 6.8 },
    { state: 'PR', policies: 55, revenue: 285000, growth: 9.3 },
    { state: 'SC', policies: 45, revenue: 235000, growth: 11.1 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const handleChartClick = (data: any, chartType: string) => {
    setSelectedData({ ...data, chartType });
    setDialogOpen(true);
  };

  const renderDetailDialog = () => {
    if (!selectedData) return null;

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Detalhes - {selectedData.name || selectedData.state}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Apólices</p>
                <p className="text-2xl font-bold text-blue-700">
                  {selectedData.policies || selectedData.value}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Receita</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {((selectedData.amount || selectedData.revenue || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Crescimento</p>
                <p className="text-2xl font-bold text-purple-700">
                  +{selectedData.growth?.toFixed(1) || '12.5'}%
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Participação</p>
                <p className="text-2xl font-bold text-orange-700">
                  {selectedData.value || '45'}%
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Insights Regionais</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Região com maior potencial de crescimento nos próximos 6 meses</li>
                <li>• Concentração de apólices corporativas acima da média nacional</li>
                <li>• Oportunidade de expansão em seguros de vida e patrimonial</li>
                <li>• Demanda crescente por seguros digitais e produtos inovadores</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Regiões</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Cidades Ativas</p>
                <p className="text-3xl font-bold">127</p>
              </div>
              <Building2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Crescimento Médio</p>
                <p className="text-3xl font-bold">+12.8%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Clientes Ativos</p>
                <p className="text-3xl font-bold">2.4K</p>
              </div>
              <Users className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Distribuição por Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={citiesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data) => handleChartClick(data, 'cities')}
                  className="cursor-pointer"
                >
                  {citiesData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, 'Participação']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Performance por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statesPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'policies' ? value : `R$ ${value.toLocaleString('pt-BR')}`,
                    name === 'policies' ? 'Apólices' : 'Receita'
                  ]}
                />
                <Bar 
                  dataKey="policies" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => handleChartClick(data, 'states')}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Análise Regional Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {regionsData.map((region, index) => (
              <div 
                key={region.name}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                onClick={() => handleChartClick(region, 'regions')}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: region.color }}
                  />
                  <h4 className="font-semibold text-gray-800">{region.name}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Participação:</span>
                    <span className="font-medium">{region.value}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crescimento:</span>
                    <span className="font-medium text-green-600">+{region.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {renderDetailDialog()}
    </div>
  );
}
