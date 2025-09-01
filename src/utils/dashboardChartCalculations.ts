
import { PolicyWithStatus } from '@/types/policyStatus';
import { getChartColor } from '@/utils/statusColors';

// Função para determinar o status correto baseado na data de vencimento
const getCorrectPolicyStatus = (policy: any): string => {
  if (!policy.endDate && !policy.expirationDate) {
    return 'vigente';
  }
  
  const now = new Date();
  const expirationDate = new Date(policy.endDate || policy.expirationDate);
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Se já venceu
  if (diffDays < 0) {
    return 'vencida';
  }
  
  // Se está vencendo nos próximos 30 dias
  if (diffDays <= 30 && diffDays >= 0) {
    return 'vencendo';
  }
  
  // Caso contrário, está vigente
  return 'ativa';
};

// Cálculo para gráfico de status das apólices
export function calculateStatusChartData(policies: PolicyWithStatus[]) {
  // Corrigir status das apólices baseado na data de vencimento
  const policiesWithCorrectStatus = policies.map(policy => ({
    ...policy,
    status: getCorrectPolicyStatus(policy)
  }));

  const statusCounts = policiesWithCorrectStatus.reduce<Record<string, number>>((acc, policy) => {
    const status = policy.status || 'vigente';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    color: getChartColor(status as any),
    name: status.replace(/_/g, " ").toUpperCase()
  }));
}

// Cálculo para gráfico de distribuição por seguradora com cores
export function calculateInsurerChartData(policies: any[]) {
  const insurerCounts = policies.reduce<Record<string, number>>((acc, policy) => {
    const insurer = policy.insurer || policy.seguradora || 'Não informado';
    acc[insurer] = (acc[insurer] || 0) + 1;
    return acc;
  }, {});

  // Cores específicas para seguradoras
  const insurerColors = {
    'Porto Seguro': '#3B82F6',
    'Porto Seguro Cia. de Seguros Gerais': '#3B82F6',
    'Bradesco': '#10B981',
    'Bradesco Seguros': '#10B981',
    'Allianz': '#F59E0B',
    'HDI SEGUROS S.A.': '#8B5CF6',
    'HDI': '#8B5CF6',
    'Darwin Seguros S.A.': '#EF4444',
    'SulAmérica': '#06B6D4',
    'Mapfre': '#84CC16',
    'Tokio Marine': '#EC4899',
    'Liberty': '#F97316',
    'AXA': '#14B8A6',
    'Generali': '#8B5CF6',
    'Outros': '#6B7280',
    'Não informado': '#9CA3AF'
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];
  
  return Object.entries(insurerCounts).map(([insurer, count], index) => ({
    insurer,
    count,
    color: insurerColors[insurer as keyof typeof insurerColors] || colors[index % colors.length],
    name: insurer
  }));
}

// Exemplo de uso no componente de dashboard:
/*
const statusChartData = calculateStatusChartData(policies);
const insurerChartData = calculateInsurerChartData(policies);

// Para usar em componente de donut/pie chart:
<PieChart data={statusChartData} />
<PieChart data={insurerChartData} />
*/
