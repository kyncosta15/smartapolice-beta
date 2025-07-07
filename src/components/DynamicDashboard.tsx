
import React from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { KPICards } from './dashboard/KPICards';
import { ClassificationCharts } from './dashboard/ClassificationCharts';
import { PersonTypeDistribution } from './dashboard/PersonTypeDistribution';
import { FinancialCharts } from './dashboard/FinancialCharts';
import { StatusEvolutionCharts } from './dashboard/StatusEvolutionCharts';
import { EmptyState } from './dashboard/EmptyState';
import { useDashboardCalculations } from './dashboard/useDashboardCalculations';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

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
    <div className="space-y-6">
      {/* KPIs principais - com dados reais para admin */}
      <KPICards
        totalPolicies={displayMetrics.totalPolicies}
        totalMonthlyCost={displayMetrics.totalMonthlyCost}
        totalInsuredValue={displayMetrics.totalInsuredValue}
        expiringPolicies={displayMetrics.expiringPolicies}
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

      {/* C. Informações financeiras */}
      <FinancialCharts financialData={dashboardData.financialData} />

      {/* D. Gestão e ciclo de vida da apólice */}
      <StatusEvolutionCharts
        statusDistribution={dashboardData.statusDistribution}
        monthlyEvolution={dashboardData.monthlyEvolution}
        colors={COLORS}
      />
    </div>
  );
}
