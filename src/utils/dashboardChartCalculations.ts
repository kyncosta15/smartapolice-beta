
import { PolicyWithStatus } from '@/types/policyStatus';
import { getChartColor } from '@/utils/statusColors';

// Cálculo para gráfico de status das apólices
export function calculateStatusChartData(policies: PolicyWithStatus[]) {
  const statusCounts = policies.reduce<Record<string, number>>((acc, policy) => {
    acc[policy.status] = (acc[policy.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    color: getChartColor(status as any),
    name: status.replace(/_/g, " ").toUpperCase()
  }));
}

// Exemplo de uso no componente de dashboard:
/*
const chartData = calculateStatusChartData(policies);

// Para usar em componente de donut/pie chart:
<PieChart data={chartData} />
*/
