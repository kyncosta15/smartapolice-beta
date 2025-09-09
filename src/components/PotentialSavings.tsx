
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react';
import { SavingsCalculator, SavingsBreakdown, SavingsRecommendation } from '@/utils/savingsCalculator';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PotentialSavingsProps {
  policies: any[];
}

export function PotentialSavings({ policies }: PotentialSavingsProps) {
  const [savingsData, setSavingsData] = useState<{
    breakdown: SavingsBreakdown;
    recommendations: SavingsRecommendation[];
  } | null>(null);

  const calculator = new SavingsCalculator();

  useEffect(() => {
    if (policies.length > 0) {
      const data = calculator.calculatePotentialSavings(policies);
      setSavingsData(data);
    }
  }, [policies]);

  if (!savingsData || policies.length === 0) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-3 bg-blue-50 rounded-full mb-4">
            <Target className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Análise de Economia Potencial
          </h3>
          <p className="text-center text-gray-600 mb-4 max-w-md">
            Faça upload de apólices para calcular automaticamente oportunidades de economia
          </p>
        </CardContent>
      </Card>
    );
  }

  const { breakdown, recommendations } = savingsData;

  const pieData = [
    { name: 'Acima Referencial', value: breakdown.aboveReference, color: '#ef4444' },
    { name: 'Duplicadas', value: breakdown.duplicatedCoverage, color: '#f97316' },
    { name: 'Subutilizadas', value: breakdown.underutilized, color: '#eab308' },
    { name: 'Excesso Mensal', value: breakdown.monthlyExcess, color: '#06b6d4' }
  ].filter(item => item.value > 0);

  const barData = [
    { category: 'Acima Referencial', value: breakdown.aboveReference },
    { category: 'Duplicadas', value: breakdown.duplicatedCoverage },
    { category: 'Subutilizadas', value: breakdown.underutilized },
    { category: 'Excesso Mensal', value: breakdown.monthlyExcess }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'low': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Target className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Economia Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              R$ {breakdown.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-600 mt-1">Potencial anual</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Acima Referencial</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {breakdown.aboveReference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Valores elevados</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Duplicadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {breakdown.duplicatedCoverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Coberturas repetidas</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Subutilizadas</CardTitle>
            <Target className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {breakdown.underutilized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Baixo uso</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Análises */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Resumo da Análise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Distribuição da Economia</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valores Acima Referencial</span>
                      <span className="font-semibold">
                        R$ {breakdown.aboveReference.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Progress value={(breakdown.aboveReference / breakdown.total) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coberturas Duplicadas</span>
                      <span className="font-semibold">
                        R$ {breakdown.duplicatedCoverage.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Progress value={(breakdown.duplicatedCoverage / breakdown.total) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Apólices Subutilizadas</span>
                      <span className="font-semibold">
                        R$ {breakdown.underutilized.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <Progress value={(breakdown.underutilized / breakdown.total) * 100} className="h-2" />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3">Insights Principais</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• {recommendations.filter(r => r.priority === 'high').length} recomendações de alta prioridade</p>
                    <p>• {recommendations.filter(r => r.priority === 'medium').length} oportunidades de otimização</p>
                    <p>• Economia média por apólice: R$ {(breakdown.total / policies.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p>• Potencial de redução: {((breakdown.total / policies.reduce((sum, p) => sum + p.premium, 0)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Recomendações de Otimização ({recommendations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getPriorityIcon(rec.priority)}
                          <h4 className="font-semibold text-gray-900">{rec.policyName}</h4>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Valor Atual:</span>
                            <p className="font-semibold">R$ {rec.currentValue.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Recomendado:</span>
                            <p className="font-semibold text-blue-600">R$ {rec.recommendedValue.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Economia:</span>
                            <p className="font-semibold text-green-600">R$ {rec.potentialSaving.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                  Distribuição por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Economia']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Economia por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Economia']} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
