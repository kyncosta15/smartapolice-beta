
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Building, Calendar, DollarSign, Clock, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClassificationChartsProps {
  typeDistribution: Array<{ name: string; value: number }>;
  insurerDistribution: Array<{ name: string; value: number }>;
  recentPolicies?: Array<{ 
    id: string;
    name: string; 
    extractedAt: string; 
    monthlyAmount?: number; 
    premium?: number; 
    endDate: string;
    insurer: string;
  }>;
  colors: string[];
}

export function ClassificationCharts({ typeDistribution, insurerDistribution, recentPolicies, colors }: ClassificationChartsProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full ${isMobile ? 'space-y-2' : 'space-y-6'} overflow-x-hidden`}>
      {/* Tipos de Seguro */}
      <Card className="w-full overflow-hidden">
        <CardHeader className={`border-b border-gray-100 ${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
            <Shield className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-blue-600`} />
            Tipos de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-48' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 50 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={isMobile ? 10 : 12}
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Seguradoras */}
      <Card className="w-full overflow-hidden">
        <CardHeader className={`border-b border-gray-100 ${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
            <Building className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-green-600`} />
            Seguradoras
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
          <div className={`${isMobile ? 'h-48' : 'h-80'} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insurerDistribution} maxBarSize={isMobile ? 30 : 60} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={isMobile ? 10 : 12}
                  interval={0}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 40}
                />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <Tooltip formatter={(value) => [value, 'Valor']} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Novas Apólices (Últimos 30 dias) */}
      <Card className="w-full overflow-hidden">
        <CardHeader className={`border-b border-gray-100 ${isMobile ? 'p-3' : ''}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
            <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-green-600`} />
            Novas Apólices (Últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
          {!recentPolicies || recentPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FileText className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mb-4 opacity-50`} />
              <p className={`text-center ${isMobile ? 'text-sm' : ''}`}>Nenhuma apólice inserida nos últimos 30 dias</p>
            </div>
          ) : (
            <div className={`space-y-3 ${isMobile ? 'max-h-60' : 'max-h-80'} overflow-y-auto w-full`}>
              {recentPolicies.map((policy, index) => (
                <div key={policy.id || index} className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'} p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full`}>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-gray-900 mb-1 ${isMobile ? 'text-sm' : ''} truncate`}>
                      {policy.name || `Apólice ${policy.id || index + 1}`}
                    </h4>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 truncate`}>
                      {policy.insurer || 'Seguradora não informada'}
                    </p>
                  </div>
                  
                  <div className={`${isMobile ? 'grid grid-cols-3 gap-2 text-center' : 'grid grid-cols-3 gap-6 text-center'} ${isMobile ? 'w-full' : ''}`}>
                    {/* Data de Inserção */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Inserida</span>
                      </div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                        {new Date(policy.extractedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Valor */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Valor</span>
                      </div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-600`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(policy.monthlyAmount || policy.premium || 0)}
                      </p>
                    </div>

                    {/* Data de Vencimento */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Vencimento</span>
                      </div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                        {new Date(policy.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
