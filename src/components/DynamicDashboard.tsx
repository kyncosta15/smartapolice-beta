
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

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

  const DashboardData = useDashboardCalculations(policies);
  const { metrics: realMetrics, isLoading: realDataLoading } = useRealDashboardData();

  // Para administradores, usar dados reais quando disponíveis
  const shouldUseRealData = viewMode === 'admin' && !realDataLoading;
  
  const DisplayMetrics = shouldUseRealData ? {
    TotalPolicies: realMetrics.totalPolicies,
    TotalMonthlyCost: realMetrics.monthlyPremium,
    TotalInsuredValue: DashboardData.TotalInsuredValue, // Manter calculado pois não temos no real
    ExpiringPolicies: DashboardData.ExpiringPolicies, // Manter calculado pois não temos no real
  } : {
    TotalPolicies: DashboardData.TotalPolicies,
    TotalMonthlyCost: DashboardData.TotalMonthlyCost,
    TotalInsuredValue: DashboardData.TotalInsuredValue,
    ExpiringPolicies: DashboardData.ExpiringPolicies,
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
      {/* Cabeçalho com título e botão de exportar */}
      <div className="bg-white border border-gray-200 p-6 rounded-md shadow-sm" data-exclude-pdf="true">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard de Apólices</h1>
            <p className="text-gray-600">Visão geral das suas apólices e métricas</p>
          </div>
          
          {/* Botão de exportação */}
          <div className="flex items-center gap-3">
            <PDFReportGenerator 
              policies={policies} 
              dashboardData={DashboardData}
            />
          </div>
        </div>
      </div>

      {/* Container principal do dashboard */}
      <div id="dashboard-pdf-content" className="space-y-6 bg-white p-6 print-container">
        {/* KPIs principais - com dados reais para admin */}
        <KPICards
          TotalPolicies={DisplayMetrics.TotalPolicies}
          TotalMonthlyCost={DisplayMetrics.TotalMonthlyCost}
          TotalInsuredValue={DisplayMetrics.TotalInsuredValue}
          ExpiringPolicies={DisplayMetrics.ExpiringPolicies}
          ExpiredPolicies={DashboardData.ExpiredPolicies}
          ActivePolicies={DashboardData.ActivePolicies}
        />

        {/* A. Classificação e identificação - Um embaixo do outro */}
        <ClassificationCharts
          TypeDistribution={DashboardData.TypeDistribution}
          InsurerDistribution={DashboardData.InsurerDistribution}
          RecentPolicies={DashboardData.RecentPolicies}
          colors={COLORS}
        />

        {/* Vínculo - Pessoa Física/Jurídica */}
        <PersonTypeDistribution
          PersonTypeDistribution={DashboardData.PersonTypeDistribution}
        />


        {/* D. Gestão e ciclo de vida da apólice */}
        <div className="print-status-section">
          <StatusEvolutionCharts
            StatusDistribution={DashboardData.StatusDistribution}
            MonthlyEvolution={DashboardData.MonthlyEvolution}
            colors={COLORS}
          />
        </div>
      </div>
    </div>
  );
}
