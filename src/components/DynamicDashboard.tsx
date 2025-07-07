
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

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
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

  if (policies.length === 0 && !shouldUseRealData) {
    return (
      <div className="space-y-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      {/* Cabeçalho com título e botão de exportar */}
      <div className="bg-white border border-gray-200 p-4 md:p-6 rounded-md shadow-sm" data-exclude-pdf="true">
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-1`}>
              Dashboard de Apólices
            </h1>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
              Visão geral das suas apólices e métricas
            </p>
          </div>
          
          {/* Botão de exportação */}
          <div className="flex items-center gap-3">
            <PDFReportGenerator 
              policies={policies} 
              dashboardData={dashboardData}
            />
          </div>
        </div>
      </div>

      {/* Container principal do dashboard */}
      <div id="dashboard-pdf-content" className={`space-y-${isMobile ? '4' : '6'} bg-white p-${isMobile ? '4' : '6'} print-container`}>
        {/* KPIs principais - com dados reais para admin */}
        <KPICards
          totalPolicies={displayMetrics.totalPolicies}
          totalMonthlyCost={displayMetrics.totalMonthlyCost}
          totalInsuredValue={displayMetrics.totalInsuredValue}
          expiringPolicies={displayMetrics.expiringPolicies}
          expiredPolicies={dashboardData.expiredPolicies}
          activePolicies={dashboardData.activePolicies}
        />

        {/* A. Classificação e identificação - Um embaixo do outro */}
        <ClassificationCharts
          typeDistribution={dashboardData.typeDistribution}
          insurerDistribution={dashboardData.insurerDistribution}
          recentPolicies={dashboardData.recentPolicies}
          colors={COLORS}
        />

        {/* Vínculo - Pessoa Física/Jurídica */}
        <PersonTypeDistribution
          personTypeDistribution={dashboardData.personTypeDistribution}
        />

        {/* D. Gestão e ciclo de vida da apólice */}
        <div className="print-status-section">
          <StatusEvolutionCharts
            statusDistribution={dashboardData.statusDistribution}
            monthlyEvolution={dashboardData.monthlyEvolution}
            colors={COLORS}
          />
        </div>
      </div>
    </div>
  );
}
