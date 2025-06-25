import React from 'react';

// Shared chart data and utilities - now dynamic based on extracted policies
export interface PolicyData {
  id: string;
  name: string;
  type: string;
  insurer: string;
  premium: number;
  startDate: string;
  endDate: string;
  policyNumber: string;
}

// Function to normalize policy types - residencial becomes patrimonial
export const normalizeInsuranceType = (type: string): string => {
  const normalizedType = type.toLowerCase().trim();
  
  // Map residencial to patrimonial
  if (normalizedType.includes('residencial') || normalizedType.includes('residencia')) {
    return 'patrimonial';
  }
  
  // Other normalizations
  const typeMap: { [key: string]: string } = {
    'auto': 'auto',
    'automovel': 'auto',
    'carro': 'auto',
    'vida': 'vida',
    'saude': 'saude',
    'saúde': 'saude',
    'empresarial': 'empresarial',
    'empresa': 'empresarial',
    'patrimonial': 'patrimonial',
    'patrimonio': 'patrimonial',
    'imovel': 'patrimonial',
    'imóvel': 'patrimonial'
  };
  
  return typeMap[normalizedType] || normalizedType;
};

// Generate dynamic chart data from policies
export const generateChartData = (policies: PolicyData[]) => {
  if (!policies || policies.length === 0) {
    return {
      insurerData: [],
      monthlyData: [],
      typeData: [],
      expirationData: []
    };
  }

  // Insurer distribution
  const insurerCounts = policies.reduce((acc, policy) => {
    acc[policy.insurer] = (acc[policy.insurer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const insurerData = Object.entries(insurerCounts).map(([name, count], index) => ({
    name,
    value: Math.round((count / policies.length) * 100),
    color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6B7280'][index % 5]
  }));

  // Monthly cost evolution
  const monthlyGroups = policies.reduce((acc, policy) => {
    const month = new Date(policy.startDate).toLocaleDateString('pt-BR', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { custo: 0, count: 0 };
    }
    acc[month].custo += policy.premium;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { custo: number; count: number }>);

  const monthlyData = Object.entries(monthlyGroups).map(([month, data]) => ({
    month,
    custo: Math.round(data.custo),
    apolices: data.count
  }));

  // Insurance types distribution with normalization
  const typeCounts = policies.reduce((acc, policy) => {
    const normalizedType = normalizeInsuranceType(policy.type);
    acc[normalizedType] = (acc[normalizedType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeLabels: Record<string, string> = {
    'auto': 'Seguro Auto',
    'vida': 'Seguro de Vida',
    'saude': 'Seguro Saúde',
    'patrimonial': 'Patrimonial',
    'empresarial': 'Empresarial'
  };

  const typeData = Object.entries(typeCounts).map(([type, count], index) => ({
    name: typeLabels[type] || type,
    value: Math.round((count / policies.length) * 100),
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#6B7280'][index % 5]
  }));

  // Expiration timeline
  const expirationGroups = policies.reduce((acc, policy) => {
    const month = new Date(policy.endDate).toLocaleDateString('pt-BR', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const expirationData = Object.entries(expirationGroups).map(([month, vencimentos]) => ({
    month,
    vencimentos
  }));

  return {
    insurerData,
    monthlyData,
    typeData,
    expirationData
  };
};

// Default empty state data
export const getEmptyStateData = () => ({
  insurerData: [
    { name: 'Nenhum dado', value: 100, color: '#e5e7eb' }
  ],
  monthlyData: [
    { month: 'Jan', custo: 0, apolices: 0 },
    { month: 'Fev', custo: 0, apolices: 0 },
    { month: 'Mar', custo: 0, apolices: 0 },
    { month: 'Abr', custo: 0, apolices: 0 },
    { month: 'Mai', custo: 0, apolices: 0 },
    { month: 'Jun', custo: 0, apolices: 0 }
  ],
  typeData: [
    { name: 'Nenhum dado', value: 100, color: '#e5e7eb' }
  ],
  expirationData: [
    { month: 'Jul', vencimentos: 0 },
    { month: 'Ago', vencimentos: 0 },
    { month: 'Set', vencimentos: 0 }
  ]
});

interface RenderCustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

export const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: RenderCustomLabelProps) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="11"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
