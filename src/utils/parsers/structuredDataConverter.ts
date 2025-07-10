
import { DynamicPDFData } from '@/types/pdfUpload';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { PolicyTypeNormalizer } from './policyTypeNormalizer';
import { InstallmentGenerator } from './installmentGenerator';

export class StructuredDataConverter {
  static convertStructuredData(dynamicData: DynamicPDFData, fileName: string, file?: File): ParsedPolicyData {
    console.log('📦 Processando dados estruturados');
    
    const type = PolicyTypeNormalizer.normalizeType(dynamicData.informacoes_gerais.tipo);
    const status = PolicyTypeNormalizer.determineStatus(dynamicData.vigencia.fim);
    
    // Criar nome mais descritivo
    let policyName = dynamicData.informacoes_gerais.nome_apolice;
    if (dynamicData.veiculo?.marca && dynamicData.veiculo?.modelo) {
      policyName = `${dynamicData.veiculo.marca} ${dynamicData.veiculo.modelo}`;
    } else if (dynamicData.segurado?.nome) {
      policyName = `Apólice ${dynamicData.segurado.nome.split(' ')[0]}`;
    }
    
    // Usar parcelas detalhadas se disponíveis, senão gerar
    const installmentsArray = dynamicData.parcelas_detalhadas || 
      InstallmentGenerator.generateInstallmentsArray(
        dynamicData.informacoes_financeiras.premio_mensal,
        dynamicData.vigencia.inicio,
        12
      );
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: policyName,
      type,
      insurer: dynamicData.seguradora.empresa,
      premium: dynamicData.informacoes_financeiras.premio_anual,
      monthlyAmount: dynamicData.informacoes_financeiras.premio_mensal,
      startDate: dynamicData.vigencia.inicio,
      endDate: dynamicData.vigencia.fim,
      policyNumber: dynamicData.informacoes_gerais.numero_apolice,
      paymentFrequency: 'mensal',
      status,
      file,
      extractedAt: dynamicData.vigencia.extraido_em,
      
      // Parcelas individuais com valores e datas
      installments: installmentsArray,
      
      // Campos expandidos
      insuredName: dynamicData.segurado?.nome,
      vehicleDetails: dynamicData.veiculo ? {
        brand: dynamicData.veiculo.marca,
        model: dynamicData.veiculo.modelo,
        year: dynamicData.veiculo.ano_modelo ? parseInt(dynamicData.veiculo.ano_modelo.toString()) : undefined,
        plate: dynamicData.veiculo.placa,
        usage: dynamicData.veiculo.uso
      } : undefined,
      broker: dynamicData.seguradora.entidade,
      
      // Coberturas array - mantendo a estrutura original do N8N
      coberturas: dynamicData.coberturas || [],
      
      // Informações de cobertura legacy (se disponível)
      coverageDetails: dynamicData.coberturas ? {
        materialDamage: dynamicData.coberturas.find(c => c.descricao.toLowerCase().includes('material'))?.lmi,
        bodilyInjury: dynamicData.coberturas.find(c => c.descricao.toLowerCase().includes('corporal'))?.lmi,
        comprehensive: dynamicData.seguradora.cobertura.toLowerCase().includes('compreensiva')
      } : undefined
    };
  }
}
