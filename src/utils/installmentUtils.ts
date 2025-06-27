
import { ParsedPolicyData, InstallmentData } from '@/utils/policyDataParser';

export interface ExtendedInstallment {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
  policyName: string;
  policyType: string;
  insurer: string;
}

export function generateSimulatedInstallments(policy: ParsedPolicyData): InstallmentData[] {
  const monthlyAmount = policy.monthlyAmount || (policy.premium / 12) || 100;
  const startDate = new Date(policy.startDate || new Date());
  const numberOfInstallments = 12;
  
  const installments = [];
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);
    
    // Adicionar pequena variação no valor para realismo
    const variation = (Math.random() - 0.5) * 20;
    const installmentValue = Math.round((monthlyAmount + variation) * 100) / 100;
    
    installments.push({
      numero: i + 1,
      valor: installmentValue,
      data: installmentDate.toISOString().split('T')[0],
      status: installmentDate < new Date() ? 'paga' : 'pendente'
    });
  }
  
  return installments;
}

export function createExtendedInstallments(policies: ParsedPolicyData[]): ExtendedInstallment[] {
  return policies.flatMap(policy => 
    policy.installments.map(installment => ({
      numero: installment.numero,
      valor: installment.valor,
      data: installment.data,
      status: installment.status,
      policyName: policy.name,
      policyType: policy.type,
      insurer: policy.insurer
    }))
  );
}

export function filterUpcomingInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate >= today && installmentDate <= thirtyDaysFromNow && installment.status === 'pendente';
  });
}

export function filterOverdueInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    return installmentDate < today && installment.status === 'pendente';
  });
}

export function filterPaidInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  return allInstallments.filter(installment => installment.status === 'paga');
}
