
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

  // Transform insurer data to match expected format - fix property mapping
  const insurerDistributionFormatted = insurerChartData.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }));

  // Transform status data to match expected format - fix property mapping
  const statusDistributionFormatted = statusChartData.map(item => ({
    name: item.name,
    value: item.value
  }));

  // Transform recent policies to match expected format
  const recentPoliciesFormatted = (dashboardData.recentPolicies || []).map(policy => {
    // Find the original policy to get additional data
    const originalPolicy = policies.find(p => p.id === policy.id);
    
    return {
      name: policy.name,
      insurer: policy.insurer,
      value: policy.premium || policy.monthlyAmount || 0,
      dueDate: policy.endDate,
      insertDate: policy.extractedAt,
      type: originalPolicy?.type || 'Não informado',
      status: originalPolicy?.status || 'Ativa'
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
    <div className={`w-full ${isMobile ? 'space-y-2 px-0' : 'space-y-6'} overflow-hidden max-w-full`}>
      {/* Cabeçalho com título e botão de exportar */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm" data-exclude-pdf="true">
        <div className={`${isMobile ? 'p-2' : 'p-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
            <div>
              <h1 className={`${isMobile ? 'text-sm' : 'text-2xl'} font-bold text-gray-900 mb-1`}>
                Dashboard de Apólices
              </h1>
              <p className={`${isMobile ? 'text-xs' : 'text-base'} text-gray-600`}>
                Visão geral das suas apólices e métricas
              </p>
            </div>
            
            {/* Botão de exportação */}
            {!isMobile && (
              <div className="flex items-center gap-3">
                <PDFReportGenerator 
                  policies={policies} 
                  dashboardData={dashboardData}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Container principal do dashboard */}
      <div id="dashboard-pdf-content" className={`w-full ${isMobile ? 'space-y-2' : 'space-y-6'} bg-white ${isMobile ? 'p-1' : 'p-6'} print-container overflow-hidden max-w-full`}>
        {/* KPIs principais - com dados reais para admin */}
        <div className="w-full overflow-hidden">
          <KPICards
            totalPolicies={displayMetrics.totalPolicies}
            totalMonthlyCost={displayMetrics.totalMonthlyCost}
            totalInsuredValue={displayMetrics.totalInsuredValue}
            expiringPolicies={displayMetrics.expiringPolicies}
            expiredPolicies={dashboardData.expiredPolicies}
            activePolicies={dashboardData.activePolicies}
            onTotalClick={handleTotalClick}
          />
        </div>

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
