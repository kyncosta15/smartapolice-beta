
import React from 'react';

// Shared chart data and utilities
export const insurerData = [
  { name: 'Porto Seguro', value: 35, color: '#3B82F6' },
  { name: 'SulAmérica', value: 25, color: '#8B5CF6' },
  { name: 'Bradesco', value: 20, color: '#10B981' },
  { name: 'Allianz', value: 12, color: '#F59E0B' },
  { name: 'Outros', value: 8, color: '#6B7280' }
];

export const monthlyData = [
  { month: 'Jan', custo: 125000, apolices: 45 },
  { month: 'Feb', custo: 132000, apolices: 48 },
  { month: 'Mar', custo: 128000, apolices: 46 },
  { month: 'Apr', custo: 135000, apolices: 52 },
  { month: 'May', custo: 142000, apolices: 55 },
  { month: 'Jun', custo: 138000, apolices: 53 }
];

export const typeData = [
  { name: 'Seguro Auto', value: 40, color: '#3B82F6' },
  { name: 'Vida/Saúde', value: 30, color: '#10B981' },
  { name: 'Patrimonial', value: 20, color: '#F59E0B' },
  { name: 'Empresarial', value: 10, color: '#8B5CF6' }
];

export const expirationData = [
  { month: 'Jul', vencimentos: 12 },
  { month: 'Ago', vencimentos: 18 },
  { month: 'Set', vencimentos: 8 },
  { month: 'Out', vencimentos: 15 },
  { month: 'Nov', vencimentos: 22 },
  { month: 'Dez', vencimentos: 10 }
];

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

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
