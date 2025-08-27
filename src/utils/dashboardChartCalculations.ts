
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { extractFieldValue } from '@/utils/extractFieldValue';

export const calculateInsurerChartData = (policies: ParsedPolicyData[]) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];
  
  console.log('🔍 Calculando dados do gráfico de seguradoras...');
  
  const insurerCounts = new Map<string, number>();
  
  policies.forEach(policy => {
    // Usar extractFieldValue para processar o campo insurer de forma segura
    const insurerName = extractFieldValue(policy.insurer);
    const safeName = insurerName || 'Seguradora Não Informada';
    
    console.log('📊 Processando seguradora:', { original: policy.insurer, extracted: safeName });
    
    insurerCounts.set(safeName, (insurerCounts.get(safeName) || 0) + 1);
  });

  const chartData = Array.from(insurerCounts.entries())
    .map(([insurer, count], index) => ({
      insurer,
      count,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.count - a.count);

  console.log('📈 Dados do gráfico de seguradoras processados:', chartData);
  return chartData;
};

export const calculateStatusChartData = (policies: any[]) => {
  console.log('🔍 Calculando dados do gráfico de status...');
  
  const statusCounts = new Map<string, number>();
  
  policies.forEach(policy => {
    // Usar extractFieldValue para processar o status de forma segura
    const statusValue = extractFieldValue(policy.status || policy.policyStatus);
    const safeStatus = statusValue || 'Status Não Informado';
    
    console.log('📊 Processando status:', { original: policy.status, extracted: safeStatus });
    
    statusCounts.set(safeStatus, (statusCounts.get(safeStatus) || 0) + 1);
  });

  const chartData = Array.from(statusCounts.entries()).map(([name, count]) => ({
    name,
    count
  }));

  console.log('📈 Dados do gráfico de status processados:', chartData);
  return chartData;
};
