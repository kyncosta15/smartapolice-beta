
import { ParsedPolicyData, InstallmentData } from '@/utils/policyDataParser';

export interface ExtendedInstallment {
  numero: number;
  valor: number;
  data: string;
  status: 'pendente'; // Removido 'paga', apenas 'pendente'
  policyName: string;
  policyType: string;
  insurer: string;
}

export function generateSimulatedInstallments(policy: ParsedPolicyData): InstallmentData[] {
  // Usar valor segurado ou prêmio como base para calcular parcelas
  const totalValue = policy.totalCoverage || policy.premium || 1000;
  const startDate = new Date(policy.startDate || new Date());
  const numberOfInstallments = 12;
  
  // Calcular valor base da parcela
  const baseInstallmentValue = totalValue / numberOfInstallments;
  
  const installments = [];
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);
    installmentDate.setHours(0, 0, 0, 0);
    
    // Primeira parcela pode ter um valor ligeiramente diferente para compensar arredondamentos
    let installmentValue = baseInstallmentValue;
    if (i === 0) {
      // Ajustar primeira parcela para que o total seja exato
      const remainingValue = totalValue - (baseInstallmentValue * (numberOfInstallments - 1));
      installmentValue = remainingValue;
    }
    
    // Todas as parcelas são pendentes - status será determinado pela data
    installments.push({
      numero: i + 1,
      valor: Math.round(installmentValue * 100) / 100,
      data: installmentDate.toISOString().split('T')[0],
      status: 'pendente' as const
    });
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log(`📊 Parcelas geradas para ${policy.name}:`, {
    total: installments.length,
    vencidas: installments.filter(i => {
      const instDate = new Date(i.data);
      instDate.setHours(0, 0, 0, 0);
      return instDate < today;
    }).length,
    aVencer: installments.filter(i => {
      const instDate = new Date(i.data);
      instDate.setHours(0, 0, 0, 0);
      return instDate >= today;
    }).length
  });
  
  return installments;
}

export function createExtendedInstallments(policies: ParsedPolicyData[]): ExtendedInstallment[] {
  return policies.flatMap(policy => {
    // Check if installments is an array
    const installmentsArray = Array.isArray(policy.installments) ? policy.installments : [];
    
    return installmentsArray.map(installment => ({
      numero: installment.numero,
      valor: installment.valor,
      data: installment.data,
      status: 'pendente' as const, // Todas as parcelas são pendentes
      policyName: policy.name,
      policyType: policy.type,
      insurer: policy.insurer
    }));
  });
}

export function filterUpcomingInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);
  next30Days.setHours(0, 0, 0, 0);
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    // A vencer: data entre hoje e 30 dias
    return installmentDate >= today && installmentDate <= next30Days;
  });
}

export function filterOverdueInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    // Vencidas: data < hoje
    return installmentDate < today;
  });
}

export function calculateDuingNext30Days(allInstallments: ExtendedInstallment[]): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const daqui30 = new Date();
  daqui30.setDate(hoje.getDate() + 30);
  daqui30.setHours(0, 0, 0, 0);

  let vencendoProximos30Dias = 0;

  for (const installment of allInstallments) {
    const venc = new Date(installment.data + "T00:00:00");

    if (venc >= hoje && venc <= daqui30) {
      vencendoProximos30Dias++;
    }
  }

  console.log(`📅 Parcelas vencendo nos próximos 30 dias: ${vencendoProximos30Dias}`);
  
  return vencendoProximos30Dias;
}
