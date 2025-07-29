import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { NewPolicyModal } from '../NewPolicyModal';
import { FileText, Calendar, DollarSign, Clock } from 'lucide-react';

interface ClassificationChartsProps {
  typeDistribution: Array<{ name: string; value: number; color: string }>;
  insurerDistribution: Array<{ name: string; value: number; color: string }>;
  recentPolicies: Array<{
    name: string;
    insurer: string;
    value: number;
    dueDate: string;
    insertDate: string;
    type?: string;
    status?: string;
  }>;
  colors: string[];
}

export function ClassificationCharts({ 
  typeDistribution, 
  insurerDistribution, 
  recentPolicies, 
  colors 
}: ClassificationChartsProps) {
  const isMobile = useIsMobile();
  const [selectedPolicy, setSelectedPolicy] = useState<typeof recentPolicies[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePolicyClick = (policy: typeof recentPolicies[0]) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`${label}`}</p>
          <p className="text-sm text-blue-600">{`Valor: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Distribuição por Tipo */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 300}>
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      isMobile ? '' : `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Seguradora */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
              Distribuição por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {insurerDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 300}>
                <BarChart data={insurerDistribution} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 40}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Novas Apólices (30 dias) - Span completo */}
        <Card className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 flex items-center`}>
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Novas Apólices (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {recentPolicies.length > 0 ? (
              <div className="space-y-3">
                {recentPolicies.slice(0, 5).map((policy, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handlePolicyClick(policy)}
                  >
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {policy.name}
                        </p>
                        <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {policy.insurer}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'} flex items-center justify-center gap-1`}>
                            <Calendar className="h-3 w-3" />
                            Inserida
                          </p>
                          <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {new Date(policy.insertDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'} flex items-center justify-center gap-1`}>
                            <DollarSign className="h-3 w-3" />
                            Valor
                          </p>
                          <p className={`font-medium text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            R$ {policy.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'} flex items-center justify-center gap-1`}>
                            <Clock className="h-3 w-3" />
                            Vencimento
                          </p>
                          <p className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            {new Date(policy.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p className="text-sm">Nenhuma apólice recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para exibir detalhes da nova apólice */}
      <NewPolicyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        policy={selectedPolicy}
      />
    </>
  );
}
