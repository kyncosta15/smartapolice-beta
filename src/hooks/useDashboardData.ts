
import { useState, useEffect } from 'react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useDashboardCalculations } from '@/components/dashboard/useDashboardCalculations';

export function useDashboardData(policies: ParsedPolicyData[]) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Use the dashboard calculations hook to get computed metrics
  const dashboardData = useDashboardCalculations(policies);

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    console.log('Atualizando dashboard...');
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLastUpdate(new Date());
    setIsRefreshing(false);
    console.log('Dashboard atualizado:', new Date().toLocaleTimeString());
  };

  useEffect(() => {
    if (policies.length > 0) {
      setLastUpdate(new Date());
    }
  }, [policies.length]);

  return {
    dashboardData,
    isRefreshing,
    lastUpdate,
    refreshDashboard
  };
}
