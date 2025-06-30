
import React from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { KPICards } from './dashboard/KPICards';
import { ClassificationCharts } from './dashboard/ClassificationCharts';
import { PersonTypeDistribution } from './dashboard/PersonTypeDistribution';
import { FinancialCharts } from './dashboard/FinancialCharts';
import { StatusEvolutionCharts } from './dashboard/StatusEvolutionCharts';
import { EmptyState } from './dashboard/EmptyState';
import { useDashboardCalculations } from './dashboard/useDashboardCalculations';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

  const dashboardData = useDashboardCalculations(policies);

  if (policies.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <KPICards
        totalPolicies={dashboardData.totalPolicies}
        totalMonthlyCost={dashboardData.totalMonthlyCost}
        totalInsuredValue={dashboardData.totalInsuredValue}
        expiringPolicies={dashboardData.expiringPolicies}
      />

      {/* A. Classificação e identificação */}
      <ClassificationCharts
        typeDistribution={dashboardData.typeDistribution}
        insurerDistribution={dashboardData.insurerDistribution}
        categoryDistribution={dashboardData.categoryDistribution}
        colors={COLORS}
      />

      {/* Categoria e Vínculo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          {/* Categories chart is already included in ClassificationCharts */}
        </div>
        <PersonTypeDistribution
          personTypeDistribution={dashboardData.personTypeDistribution}
        />
      </div>

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
