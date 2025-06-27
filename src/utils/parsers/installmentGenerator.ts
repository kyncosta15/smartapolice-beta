
import { InstallmentData } from '@/types/dynamicPolicyTypes';

export class InstallmentGenerator {
  static generateInstallmentsFromVencimentos(vencimentos: string[], monthlyValue: number, startDate: string): InstallmentData[] {
    const installments: InstallmentData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔄 Processando vencimentos futuros do N8N:', vencimentos);
    
    vencimentos.forEach((vencimento, index) => {
      const installmentDate = new Date(vencimento);
      installmentDate.setHours(0, 0, 0, 0);
      
      // Validar se a data é válida
      if (isNaN(installmentDate.getTime())) {
        console.warn(`⚠️ Data de vencimento inválida no índice ${index}:`, vencimento);
        return;
      }
      
      // Determinar status baseado na data
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        // Parcelas do passado têm 70% de chance de estarem pagas
        status = Math.random() > 0.3 ? 'paga' : 'pendente';
      }
      
      installments.push({
        numero: index + 1,
        valor: Math.round(monthlyValue * 100) / 100,
        data: installmentDate.toISOString().split('T')[0],
        status: status
      });
    });
    
    console.log('✅ Parcelas geradas a partir dos vencimentos N8N:', installments);
    return installments;
  }

  static generateInstallmentsArray(monthlyValue: number, startDate: string, numberOfInstallments: number): InstallmentData[] {
    const installments: InstallmentData[] = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      // Pequena variação no valor para simular ajustes reais
      const variation = (Math.random() - 0.5) * 20; // Variação de até ±10 reais
      const installmentValue = Math.round((monthlyValue + variation) * 100) / 100;
      
      installments.push({
        numero: i + 1,
        valor: installmentValue,
        data: installmentDate.toISOString().split('T')[0],
        status: installmentDate < new Date() ? 'paga' : 'pendente'
      });
    }
    
    return installments;
  }
}
