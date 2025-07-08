
import { N8NDirectData } from '@/types/dynamicPolicyTypes';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';
import { InstallmentGenerator } from './installmentGenerator';
import { InstallmentAnalyzer } from './installmentAnalyzer';

export class N8NDataConverter {
  static convertN8NDirectData(n8nData: N8NDirectData, fileName: string, file?: File): ParsedPolicyData {
    console.log('📦 Processando dados diretos do N8N');
    console.log('📋 Tipo original recebido:', n8nData.tipo);
    
    const type = PolicyTypeNormalizer.normalizeType(n8nData.tipo);
    console.log('📋 Tipo normalizado:', type);
    const status = PolicyTypeNormalizer.determineStatus(n8nData.fim);
    
    // Criar nome mais descritivo usando o primeiro nome do segurado
    const policyName = n8nData.segurado ? 
      `Apólice ${n8nData.segurado.split(' ')[0]}` : 
      `Apólice ${n8nData.seguradora}`;
    
    console.log('📋 Mapeando dados N8N:', {
      segurado: n8nData.segurado,
      documento: n8nData.documento, 
      documento_tipo: n8nData.documento_tipo,
      coberturas: n8nData.coberturas,
      policyName
    });
    
    // Analisar vencimentos para obter estatísticas
    const installmentAnalysis = InstallmentAnalyzer.analyzeInstallments(n8nData.vencimentos_futuros);
    
    // Processar vencimentos futuros para criar parcelas com análise de status
    const installmentsArray = InstallmentGenerator.generateInstallmentsFromVencimentos(
      n8nData.vencimentos_futuros,
      n8nData.custo_mensal,
      n8nData.inicio
    );
    
    console.log(`📊 Análise da apólice ${policyName}:`, {
      vencidas: installmentAnalysis.vencidas,
      aVencer: installmentAnalysis.aVencer,
      proximoVencimento: installmentAnalysis.proximoVencimento,
      coberturas: n8nData.coberturas?.length || 0
    });
    
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
      
      // Campos de documento do N8N
      documento: n8nData.documento,
      documento_tipo: n8nData.documento_tipo,
      
      // Campos específicos de veículo e localização
      vehicleModel: n8nData.modelo_veiculo,
      uf: n8nData.uf,
      deductible: n8nData.franquia,
      
      // Coberturas do N8N
      coberturas: n8nData.coberturas,
      
      // Análise de vencimentos
      overdueInstallments: installmentAnalysis.vencidas,
      upcomingInstallments: installmentAnalysis.aVencer,
      nextDueDate: installmentAnalysis.proximoVencimento,
      
      // Legacy fields for compatibility
      entity: n8nData.corretora || n8nData.seguradora,
      category: type === 'auto' ? 'Veicular' : 
               type === 'vida' ? 'Pessoal' : 
               type === 'saude' ? 'Saúde' : 
               type === 'acidentes_pessoais' ? 'Pessoal' : 'Geral',
      coverage: n8nData.coberturas || ['Cobertura Básica'],
      totalCoverage: n8nData.premio
    };
  }
}
