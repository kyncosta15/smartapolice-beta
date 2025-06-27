
import { N8NDirectData } from '@/types/dynamicPolicyTypes';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';
import { InstallmentGenerator } from './installmentGenerator';

export class N8NDataConverter {
  static convertN8NDirectData(n8nData: N8NDirectData, fileName: string, file?: File): ParsedPolicyData {
    console.log('📦 Processando dados diretos do N8N');
    
    const type = PolicyTypeNormalizer.normalizeType(n8nData.tipo);
    const status = PolicyTypeNormalizer.determineStatus(n8nData.fim);
    
    // Criar nome mais descritivo
    const policyName = n8nData.segurado ? 
      `Apólice ${n8nData.segurado.split(' ')[0]}` : 
      `Apólice ${n8nData.seguradora}`;
    
    // Processar vencimentos futuros para criar parcelas
    const installmentsArray = InstallmentGenerator.generateInstallmentsFromVencimentos(
      n8nData.vencimentos_futuros,
      n8nData.custo_mensal,
      n8nData.inicio
    );
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: policyName,
      type,
      insurer: n8nData.seguradora,
      premium: n8nData.premio,
      monthlyAmount: n8nData.custo_mensal,
      startDate: n8nData.inicio,
      endDate: n8nData.fim,
      policyNumber: n8nData.numero_apolice,
      paymentFrequency: 'mensal',
      status,
      file,
      extractedAt: new Date().toISOString().split('T')[0],
      
      // Parcelas individuais com valores e datas
      installments: installmentsArray,
      
      // Campos expandidos
      insuredName: n8nData.segurado,
      
      // Legacy fields for compatibility
      entity: n8nData.seguradora,
      category: type === 'auto' ? 'Veicular' : 'Geral',
      coverage: ['Cobertura Básica'],
      totalCoverage: n8nData.premio
    };
  }
}
