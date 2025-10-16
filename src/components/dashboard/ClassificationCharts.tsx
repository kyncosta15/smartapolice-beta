
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, Label } from 'recharts';
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

// Cores específicas para cada tipo de seguradora
const INSURER_COLORS: Record<string, string> = {
  'Porto Seguro': '#e11d48',
  'Porto Seguro Cia. de Seguros Gerais': '#e11d48',
  'Bradesco': '#059669',
  'Bradesco Seguros': '#059669',
  'SulAmérica': '#2563eb',
  'Allianz': '#f59e0b',
  'HDI Seguros': '#8b5cf6',
  'HDI SEGUROS S.A.': '#8b5cf6',
  'HDI': '#8b5cf6',
  'Liberty Seguros': '#06b6d4',
  'Liberty': '#06b6d4',
  'Tokio Marine': '#ec4899',
  'Mapfre': '#84cc16',
  'Zurich': '#1d4ed8',
  'Darwin Seguros S.A.': '#ef4444',
  'Sompo Seguros': '#f97316',
  'Itaú Seguros': '#10b981',
  'Azul Seguros': '#3b82f6',
  'Alfa Seguradora': '#7c3aed',
  'Suhai Seguradora': '#14b8a6',
  'Excelsior Seguros': '#f59e0b',
  'Too Seguros': '#6366f1',
  'Icatu Seguros': '#8b5cf6',
  'Capemisa': '#10b981',
  'MetLife': '#059669',
  'Prudential': '#2563eb',
  'Youse': '#ef4444',
  'Seguros Unimed': '#22c55e',
  'Centauro-ON': '#f97316',
  'BB Seguros': '#eab308',
  'Assurant': '#6b7280',
  'Não informado': '#9ca3af',
  'Outros': '#6b7280'
};

// Cores para tipos de seguro
const TYPE_COLORS: Record<string, string> = {
  'Auto': '#3b82f6',
  'Vida': '#10b981',
  'Saúde': '#f59e0b',
  'Empresarial': '#8b5cf6',
  'Patrimonial': '#ef4444',
  'Acidentes Pessoais': '#06b6d4',
  'Responsabilidade Civil': '#84cc16',
  'Outros': '#6b7280'
};

export function ClassificationCharts({ 
  typeDistribution, 
  insurerDistribution, 
  recentPolicies, 
  colors 
}: ClassificationChartsProps) {
  const isMobile = useIsMobile();
  const [selectedPolicy, setSelectedPolicy] = useState<typeof recentPolicies[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate total for donut chart center
  const totalPolicies = React.useMemo(() => {
    return typeDistribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [typeDistribution]);

  // Helper function to safely render insurer values
  const safeRenderInsurer = (insurer: any): string => {
    if (!insurer) return "Não informado";
    if (typeof insurer === "string") return insurer;
    if (typeof insurer === "object") {
      return insurer.empresa || insurer.name || insurer.categoria || "Seguradora";
    }
    return String(insurer);
  };

  const handlePolicyClick = (policy: typeof recentPolicies[0]) => {
    setSelectedPolicy(policy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  // Aplicar cores específicas aos dados de distribuição
  const typeDistributionWithColors = typeDistribution.map(item => ({
    ...item,
    color: TYPE_COLORS[item.name] || item.color || '#6b7280'
  }));

  const insurerDistributionWithColors = insurerDistribution.map(item => ({
    ...item,
    color: INSURER_COLORS[item.name] || item.color || '#6b7280'
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`${label}`}</p>
          <p className="text-sm text-blue-600">{`Valor: ${payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[160px]">
          <p className="text-sm font-semibold text-gray-900 mb-1">{payload[0].name}</p>
          <p className="text-base font-bold text-blue-600">
            {`Valor: ${payload[0].value.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Distribuição por Tipo */}
        <Card className="bg-white border border-gray-200 shadow-sm" data-chart="type-distribution">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {typeDistributionWithColors.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                  <Tooltip content={<PieTooltip />} />
                  <Pie
                    data={typeDistributionWithColors}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 80 : 100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ value }: any) => {
                      return value.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      });
                    }}
                    strokeWidth={3}
                    stroke="white"
                  >
                    {typeDistributionWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
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
        <Card className="bg-white border border-gray-200 shadow-sm" data-chart="insurer-distribution">
          <CardHeader className={`${isMobile ? 'p-3 pb-1' : 'p-6 pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>
              Distribuição por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'p-3 pt-1' : 'p-6 pt-2'}`}>
            {insurerDistributionWithColors.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 350}>
                <BarChart 
                  data={insurerDistributionWithColors} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                  barSize={isMobile ? 20 : 28}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 80 : 120}
                    hide
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    radius={4}
                  >
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      style={{ fill: 'white', fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
                    />
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      style={{ fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
                      formatter={(value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    />
                    {insurerDistributionWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Novas Apólices (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPolicies.length > 0 ? (
              <div className="space-y-2">
                {recentPolicies.slice(0, 5).map((policy, index) => (
                  <div 
                    key={index}
                    className="group flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-all"
                    onClick={() => handlePolicyClick(policy)}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium text-sm truncate">
                        {policy.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {safeRenderInsurer(policy.insurer)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-primary">
                          {policy.value.toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">Prêmio Total</p>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {new Date(policy.insertDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p>Inserida</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {new Date(policy.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p>Vencimento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
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
