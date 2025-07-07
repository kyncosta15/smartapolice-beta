
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Building, Calendar, DollarSign, Clock, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  return (
    <div className="space-y-6">
      {/* Tipos de Seguro */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Tipos de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Building className="h-5 w-5 mr-2 text-green-600" />
            Seguradoras
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insurerDistribution} maxBarSize={60}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Valor']} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Novas Apólices (Últimos 30 dias) */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2 text-green-600" />
            Novas Apólices (Últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!recentPolicies || recentPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">Nenhuma apólice inserida nos últimos 30 dias</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentPolicies.map((policy, index) => (
                <div key={policy.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {policy.name || `Apólice ${policy.id || index + 1}`}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {policy.insurer || 'Seguradora não informada'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 text-center">
                    {/* Data de Inserção */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Inserida</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(policy.extractedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Valor */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Valor</span>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(policy.monthlyAmount || policy.premium || 0)}
                      </p>
                    </div>

                    {/* Data de Vencimento */}
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Vencimento</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
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
