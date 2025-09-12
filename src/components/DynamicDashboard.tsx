
import React, { useRef } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { KPICards } from './dashboard/KPICards';
import { ClassificationCharts } from './dashboard/ClassificationCharts';
import { PersonTypeDistribution } from './dashboard/PersonTypeDistribution';  
import { StatusEvolutionCharts } from './dashboard/StatusEvolutionCharts';
import { EmptyState } from './dashboard/EmptyState';
import { useDashboardCalculations } from './dashboard/useDashboardCalculations';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';
import { PDFReportGenerator } from './PDFReportGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateStatusChartData, calculateInsurerChartData } from '@/utils/dashboardChartCalculations';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
  onSectionChange?: (section: string) => void;
}

export function DynamicDashboard({ policies, viewMode = 'client', onSectionChange }: DynamicDashboardProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];
  const isMobile = useIsMobile();

  const dashboardData = useDashboardCalculations(policies);
  const { metrics: realMetrics, isLoading: realDataLoading } = useRealDashboardData();

  // Para administradores, usar dados reais quando disponíveis
  const shouldUseRealData = viewMode === 'admin' && !realDataLoading;
  
  const displayMetrics = shouldUseRealData ? {
    totalPolicies: realMetrics.totalPolicies,
    totalMonthlyCost: realMetrics.monthlyPremium,
    totalInsuredValue: dashboardData.totalInsuredValue, // Manter calculado pois não temos no real
    expiringPolicies: dashboardData.expiringPolicies, // Manter calculado pois não temos no real
  } : {
    totalPolicies: dashboardData.totalPolicies,
    totalMonthlyCost: dashboardData.totalMonthlyCost,
    totalInsuredValue: dashboardData.totalInsuredValue,
    expiringPolicies: dashboardData.expiringPolicies,
  };

  const handleTotalClick = () => {
    if (onSectionChange) {
      onSectionChange('policies');
    }
  };

  // Usar os novos cálculos com cores corretas
  const statusChartData = calculateStatusChartData(policies as any);
  const insurerChartData = calculateInsurerChartData(policies);

  // Add colors to distribution data
  const typeDistributionWithColors = dashboardData.typeDistribution.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  // Transform insurer data to match expected format - ENSURE ALL STRINGS
  const insurerDistributionFormatted = insurerChartData.map(item => ({
    name: String(item.insurer || 'N/A'),
    value: item.count,
    color: item.color
  }));

  // Transform status data to match expected format - ENSURE ALL STRINGS
  const statusDistributionFormatted = statusChartData.map(item => ({
    name: String(item.name || 'N/A'),
    value: item.count
  }));

  // Transform recent policies to match expected format
  const recentPoliciesFormatted = (dashboardData.recentPolicies || []).map(policy => {
    // Find the original policy to get additional data
    const originalPolicy = policies.find(p => p.id === policy.id);
    
    return {
      name: String(policy.name || 'N/A'),
      insurer: String(policy.insurer || 'N/A'),
      value: policy.premium || policy.monthlyAmount || 0,
      dueDate: policy.endDate,
      insertDate: policy.extractedAt,
      type: String(originalPolicy?.type || 'Não informado'),
      status: String(originalPolicy?.status || 'Ativa')
    };
  });

  if (policies.length === 0 && !shouldUseRealData) {
    return (
      <div className="space-y-2">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`w-full ${isMobile ? 'space-y-4 px-0' : 'space-y-6'} overflow-hidden max-w-full`}>
      {/* Container principal do dashboard - sem cabeçalho duplicado */}
      <div id="dashboard-pdf-content" className={`w-full ${isMobile ? 'space-y-4' : 'space-y-6'} overflow-hidden max-w-full`}>
        {/* A. Classificação e identificação - Um embaixo do outro */}
        <div className="w-full overflow-hidden">
          <ClassificationCharts
            typeDistribution={typeDistributionWithColors}
            insurerDistribution={insurerDistributionFormatted}
            recentPolicies={recentPoliciesFormatted}
            colors={COLORS}
          />
        </div>

        {/* Vínculo - Pessoa Física/Jurídica */}
        <div className="w-full overflow-hidden">
          <PersonTypeDistribution
            personTypeDistribution={dashboardData.personTypeDistribution}
          />
        </div>

        {/* D. Gestão e ciclo de vida da apólice */}
        <div className="print-status-section w-full overflow-hidden">
          <StatusEvolutionCharts
            statusDistribution={statusDistributionFormatted}
            monthlyEvolution={dashboardData.monthlyEvolution}
            colors={COLORS}
          />
        </div>
      </div>
    </div>
  );
}
