import React from 'react';
import { formatCurrency } from '@/utils/currencyFormatter';

// Shared chart data and utilities - now dynamic based on extracted policies
export interface PolicyData {
  id: string;
  name: string;
  type: string;
  insurer: string;
  premium: number;
  monthlyAmount?: number; // Made optional to match actual usage
  startDate: string;
  endDate: string;
  policyNumber: string;
  paymentFrequency?: 'mensal' | 'anual' | 'semestral' | 'trimestral';
  
  // Add documento_tipo field for person type classification
  documento_tipo?: 'CPF' | 'CNPJ' | string;
  documento?: string;
  
  // Add installments field to support real installment data
  installments?: Array<{
    numero: number;
    valor: number;
    data: string;
    status: 'paga' | 'pendente';
  }>;
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

// Generate monthly evolution data based on policy start/end dates and payment frequency
export const generateMonthlyEvolutionData = (policies: PolicyData[]) => {
  if (!policies || policies.length === 0) {
    return getEmptyMonthlyData();
  }

  // Create a map for monthly costs
  const monthlyMap: { [key: string]: { custo: number; apolices: number; details: PolicyData[] } } = {};
  
  // Initialize 12 months from current date
  const now = new Date();
  for (let i = -6; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    monthlyMap[key] = { custo: 0, apolices: 0, details: [] };
  }

  // Process each policy
  policies.forEach(policy => {
    const startDate = new Date(policy.startDate);
    const endDate = new Date(policy.endDate);
    const monthlyAmount = policy.monthlyAmount || (policy.premium / 12);
    
    // Distribute costs across active months
    const current = new Date(startDate);
    while (current <= endDate && current <= new Date(now.getFullYear(), now.getMonth() + 6, 0)) {
      const key = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (monthlyMap[key]) {
        monthlyMap[key].custo += monthlyAmount;
        monthlyMap[key].apolices += 1;
        monthlyMap[key].details.push(policy);
      }
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }
  });

  // Convert to array format for recharts
  return Object.entries(monthlyMap)
    .map(([month, data]) => ({
      month,
      custo: Math.round(data.custo),
      apolices: data.apolices,
      details: data.details
    }))
    .sort((a, b) => {
      // Sort by chronological order
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      const dateA = new Date(2000 + parseInt(yearA), getMonthNumber(monthA));
      const dateB = new Date(2000 + parseInt(yearB), getMonthNumber(monthB));
      return dateA.getTime() - dateB.getTime();
    });
};

// Helper function to get month number
const getMonthNumber = (monthStr: string): number => {
  const months: { [key: string]: number } = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  };
  return months[monthStr.toLowerCase()] || 0;
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

  // Use the new monthly evolution data
  const monthlyData = generateMonthlyEvolutionData(policies);

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

// Default empty state data for monthly evolution
export const getEmptyMonthlyData = () => {
  const now = new Date();
  const months = [];
  
  for (let i = -6; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    months.push({ month, custo: 0, apolices: 0 });
  }
  
  return months;
};

// Default empty state data
export const getEmptyStateData = () => ({
  insurerData: [
    { name: 'Nenhum dado', value: 100, color: '#e5e7eb' }
  ],
  monthlyData: getEmptyMonthlyData(),
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
