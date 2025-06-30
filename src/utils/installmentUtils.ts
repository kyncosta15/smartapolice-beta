
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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
  
  for (let i = 0; i < numberOfInstallments; i++) {
    const installmentDate = new Date(startDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);
    installmentDate.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
    
    // Primeira parcela pode ter um valor ligeiramente diferente para compensar arredondamentos
    let installmentValue = baseInstallmentValue;
    if (i === 0) {
      // Ajustar primeira parcela para que o total seja exato
      const remainingValue = totalValue - (baseInstallmentValue * (numberOfInstallments - 1));
      installmentValue = remainingValue;
    }
    
    // Lógica mais realista para determinar o status
    let status: 'paga' | 'pendente' = 'pendente';
    
    // Se a data da parcela é anterior a hoje
    if (installmentDate < today) {
      // Determinar se foi paga ou não baseado em uma lógica mais realista
      const daysDifference = Math.floor((today.getTime() - installmentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference > 60) {
        // Parcelas com mais de 60 dias de atraso têm 80% de chance de estarem pagas
        status = Math.random() > 0.2 ? 'paga' : 'pendente';
      } else if (daysDifference > 30) {
        // Parcelas com 30-60 dias têm 60% de chance de estarem pagas
        status = Math.random() > 0.4 ? 'paga' : 'pendente';
      } else {
        // Parcelas recentemente vencidas têm 30% de chance de estarem pagas
        status = Math.random() > 0.7 ? 'paga' : 'pendente';
      }
    } else {
      // Se a data da parcela é hoje ou no futuro, está sempre pendente
      status = 'pendente';
    }
    
    installments.push({
      numero: i + 1,
      valor: Math.round(installmentValue * 100) / 100,
      data: installmentDate.toISOString().split('T')[0],
      status: status
    });
  }
  
  console.log(`📊 Parcelas geradas para ${policy.name}:`, {
    total: installments.length,
    pagas: installments.filter(i => i.status === 'paga').length,
    pendentes: installments.filter(i => i.status === 'pendente').length,
    vencidas: installments.filter(i => {
      const instDate = new Date(i.data);
      instDate.setHours(0, 0, 0, 0);
      return instDate < today && i.status === 'pendente';
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
      status: installment.status,
      policyName: policy.name,
      policyType: policy.type,
      insurer: policy.insurer
    }));
  });
}

export function filterUpcomingInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa de datas
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    // Próximas parcelas: data >= hoje E status pendente
    return installmentDate >= today && installment.status === 'pendente';
  });
}

export function filterOverdueInstallments(allInstallments: ExtendedInstallment[]): ExtendedInstallment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa de datas
  
  return allInstallments.filter(installment => {
    const installmentDate = new Date(installment.data);
    installmentDate.setHours(0, 0, 0, 0);
    // Parcelas vencidas: data < hoje E status pendente
    return installmentDate < today && installment.status === 'pendente';
  });
}

// Nova função para calcular parcelas que vencem nos próximos 30 dias
export function calculateDuingNext30Days(allInstallments: ExtendedInstallment[]): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const daqui30 = new Date();
  daqui30.setDate(hoje.getDate() + 30);
  daqui30.setHours(0, 0, 0, 0);

  let vencendoProximos30Dias = 0;

  for (const installment of allInstallments) {
    if (installment.status !== 'pendente') continue; // Só contar pendentes
    
    const venc = new Date(installment.data + "T00:00:00");

    if (venc >= hoje && venc <= daqui30) {
      vencendoProximos30Dias++;
    }
  }

  console.log(`📅 Parcelas vencendo nos próximos 30 dias: ${vencendoProximos30Dias}`);
  
  return vencendoProximos30Dias;
}
