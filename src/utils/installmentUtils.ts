
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
    
    // Primeira parcela pode ter um valor ligeiramente diferente para compensar arredondamentos
    let installmentValue = baseInstallmentValue;
    if (i === 0) {
      // Ajustar primeira parcela para que o total seja exato
      const remainingValue = totalValue - (baseInstallmentValue * (numberOfInstallments - 1));
      installmentValue = remainingValue;
    }
    
    installments.push({
      numero: i + 1,
      valor: Math.round(installmentValue * 100) / 100,
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
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa de datas
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate >= today && installment.status === 'pendente';
  });
}

export function filterOverdueInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa de datas
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    return installmentDate < today && installment.status === 'pendente';
  });
}
