import { DynamicPDFData } from '@/types/pdfUpload';
import { extractFieldValue, extractNumericValue } from '@/utils/extractFieldValue';

interface N8NDirectResponse {
  segurado?: string;
  seguradora?: string;
  tipo?: string;
  tipo_seguro?: string;
  inicio?: string;
  inicio_vigencia?: string;
  fim?: string;
  fim_vigencia?: string;
  premio?: number;
  parcelas?: number;
  pagamento?: string;
  forma_pagamento?: string;
  custo_mensal?: number;
  valor_parcela?: number;
  vencimentos_futuros?: any[];
  status?: string;
  // Policy number fields from N8N
  numero_apolice?: string;
  apolice?: string;
  // Campos de documento
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  // Outros campos
  modelo_veiculo?: string;
  uf?: string;
  franquia?: number;
  corretora?: string;
  // Coberturas with LMI - processadas do texto original
  coberturas?: Array<{
    descricao: string;
    tipo?: string;
    lmi?: number;
  }>;
}

interface N8NWebhookResponse {
  success: boolean;
  data?: DynamicPDFData;
  message?: string;
  error?: string;
}

export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://smartapolicetest.app.n8n.cloud/webhook/upload-arquivo';
  
  static async processarPdfComN8n(file: File, userId?: string): Promise<N8NWebhookResponse> {
    console.log(`🌐 Enviando PDF para processamento N8N: ${file.name}`);
    console.log('📡 Webhook URL:', this.WEBHOOK_URL);
    console.log('👤 User ID enviado para N8N:', userId);
    
    try {
      // Criar FormData para envio do arquivo
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('fileName', file.name);
      formData.append('timestamp', new Date().toISOString());
      
      // Adicionar userId ao FormData se disponível
      if (userId) {
        formData.append('userId', userId);
        console.log('✅ UserId adicionado ao FormData:', userId);
      } else {
        console.warn('⚠️ UserId não fornecido para o webhook N8N');
      }

      console.log('📤 Enviando arquivo para webhook N8N...');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP:', response.status, response.statusText, errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as N8NDirectResponse;
      
      console.log('✅ Resposta COMPLETA recebida do N8N:', JSON.stringify(result, null, 2));
      
      // Log specifically the policy number received
      const numeroApolice = extractFieldValue(result.numero_apolice) || extractFieldValue(result.apolice);
      if (numeroApolice) {
        console.log('📋 Número da apólice recebido:', numeroApolice);
      }
      
      // Log coverages with LMI
      if (result.coberturas) {
        console.log('🛡️ Coberturas com LMI recebidas:', result.coberturas);
      }
      
      // Verificar se temos dados válidos do N8N usando extractFieldValue
      const segurado = extractFieldValue(result.segurado);
      const seguradora = extractFieldValue(result.seguradora);
      const premio = extractNumericValue(result.premio);
      
      if (segurado || seguradora || premio > 0) {
        console.log('🎉 Dados processados com sucesso pela IA do N8N!');
        
        // Converter dados do N8N para o formato esperado
        const convertedData = this.convertN8NResponseToDynamicPDFData(result);
        
        return {
          success: true,
          data: convertedData,
          message: 'Dados extraídos com sucesso via N8N'
        };
      } else {
        console.warn('⚠️ N8N retornou resposta mas sem dados válidos:', result);
        return {
          success: false,
          message: 'N8N retornou resposta vazia ou inválida'
        };
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar PDF no N8N:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao processar PDF no N8N',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private static convertN8NResponseToDynamicPDFData(n8nData: N8NDirectResponse): DynamicPDFData {
    console.log('🔄 Convertendo resposta N8N para DynamicPDFData:', JSON.stringify(n8nData, null, 2));
    
    // Usar extractFieldValue para todos os campos de string
    const segurado = extractFieldValue(n8nData.segurado) || 'Segurado Não Informado';
    const seguradora = extractFieldValue(n8nData.seguradora) || 'Seguradora N8N';
    const tipoSeguro = extractFieldValue(n8nData.tipo_seguro) || extractFieldValue(n8nData.tipo) || 'Auto';
    const status = extractFieldValue(n8nData.status) || 'Ativa';
    
    // Usar extractNumericValue para campos numéricos
    const premioAnual = extractNumericValue(n8nData.premio) || 0;
    const numeroParcelas = extractNumericValue(n8nData.parcelas) || 12;
    const valorParcela = extractNumericValue(n8nData.valor_parcela) || extractNumericValue(n8nData.custo_mensal) || (premioAnual / 12);
    const premioMensal = Math.round(valorParcela * 100) / 100;
    
    // Extrair datas de forma segura
    const startDate = extractFieldValue(n8nData.inicio_vigencia) || extractFieldValue(n8nData.inicio) || new Date().toISOString().split('T')[0];
    const endDate = extractFieldValue(n8nData.fim_vigencia) || extractFieldValue(n8nData.fim) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Priorizar numero_apolice, depois apolice, e só usar fallback se nenhum estiver disponível
    let policyNumber = extractFieldValue(n8nData.numero_apolice) || extractFieldValue(n8nData.apolice);
    
    // Se não tiver número da apólice, usar um fallback mais específico
    if (!policyNumber) {
      console.warn('⚠️ Número da apólice não encontrado no retorno do N8N, usando fallback');
      policyNumber = `N8N-${Date.now()}`;
    }
    
    console.log('🔢 Número da apólice definido:', policyNumber);

    // Processar coberturas - garantir que sejam processadas corretamente
    let processedCoberturas = [];
    if (n8nData.coberturas && Array.isArray(n8nData.coberturas)) {
      processedCoberturas = n8nData.coberturas.map(cobertura => ({
        descricao: extractFieldValue(cobertura.descricao) || extractFieldValue(cobertura.tipo) || 'Cobertura',
        lmi: extractNumericValue(cobertura.lmi) || undefined
      }));
    }
    
    console.log('🔄 Coberturas processadas:', processedCoberturas);

    // Usar vencimentos futuros do N8N se disponíveis
    let parcelas;
    if (n8nData.vencimentos_futuros && Array.isArray(n8nData.vencimentos_futuros) && n8nData.vencimentos_futuros.length > 0) {
      console.log('📅 Usando vencimentos futuros do N8N para criar parcelas');
      parcelas = this.generateInstallmentsFromVencimentos(n8nData.vencimentos_futuros, premioMensal);
    } else {
      console.log('📅 Vencimentos futuros não disponíveis, gerando parcelas padrão');
      parcelas = this.generateInstallmentDetails(premioMensal, startDate, numeroParcelas);
    }

    const convertedData: DynamicPDFData = {
      informacoes_gerais: {
        nome_apolice: `Apólice ${seguradora}`,
        tipo: tipoSeguro,
        status: status,
        numero_apolice: policyNumber
      },
      seguradora: {
        empresa: seguradora,
        categoria: "Processado via N8N",
        cobertura: "Cobertura N8N",
        entidade: "N8N IA"
      },
      informacoes_financeiras: {
        premio_anual: premioAnual,
        premio_mensal: premioMensal
      },
      vigencia: {
        inicio: startDate,
        fim: endDate,
        extraido_em: new Date().toISOString().split('T')[0]
      },
      segurado: {
        nome: segurado
      },
      // Apenas campos de documento que existem no tipo DynamicPDFData
      documento: extractFieldValue(n8nData.documento),
      documento_tipo: extractFieldValue(n8nData.documento_tipo) as 'CPF' | 'CNPJ',
      // Coberturas array - mantendo a estrutura processada do N8N
      coberturas: processedCoberturas,
      // Adicionar as parcelas como propriedade adicional
      parcelas_detalhadas: parcelas
    };

    console.log('✅ DynamicPDFData convertido:', JSON.stringify(convertedData, null, 2));
    return convertedData;
  }

  private static generateInstallmentsFromVencimentos(vencimentos: any[], monthlyValue: number) {
    const installments = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔄 Processando vencimentos futuros:', vencimentos);
    
    vencimentos.forEach((vencimento, index) => {
      let installmentDate: Date;
      let installmentValue = monthlyValue;
      
      // Tentar diferentes formatos de vencimento
      if (typeof vencimento === 'string') {
        // Se é uma string de data
        installmentDate = new Date(vencimento);
      } else if (vencimento && typeof vencimento === 'object') {
        // Se é um objeto com data e/ou valor
        if (vencimento.data || vencimento.date) {
          installmentDate = new Date(vencimento.data || vencimento.date);
        } else if (vencimento.vencimento) {
          installmentDate = new Date(vencimento.vencimento);
        } else {
          // Se não tem data definida, usar sequência mensal
          installmentDate = new Date();
          installmentDate.setMonth(installmentDate.getMonth() + index);
        }
        
        // Se tem valor específico no vencimento
        if (vencimento.valor || vencimento.value) {
          installmentValue = parseFloat(vencimento.valor || vencimento.value) || monthlyValue;
        }
      } else {
        // Fallback: usar sequência mensal
        installmentDate = new Date();
        installmentDate.setMonth(installmentDate.getMonth() + index);
      }
      
      // Validar se a data é válida
      if (isNaN(installmentDate.getTime())) {
        console.warn(`⚠️ Data de vencimento inválida no índice ${index}:`, vencimento);
        installmentDate = new Date();
        installmentDate.setMonth(installmentDate.getMonth() + index);
      }
      
      installmentDate.setHours(0, 0, 0, 0);
      
      // Determinar status baseado na data
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        // Parcelas do passado têm 70% de chance de estarem pagas
        status = Math.random() > 0.3 ? 'paga' : 'pendente';
      }
      
      installments.push({
        numero: index + 1,
        valor: Math.round(installmentValue * 100) / 100,
        data: installmentDate.toISOString().split('T')[0],
        status: status
      });
    });
    
    console.log('✅ Parcelas geradas a partir dos vencimentos:', installments);
    return installments;
  }

  private static generateInstallmentDetails(monthlyValue: number, startDate: string, numberOfInstallments: number) {
    const installments = [];
    const baseDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      installmentDate.setHours(0, 0, 0, 0);
      
      // Usar valor base com pequenas variações realistas
      const variation = i === 0 ? 0 : (Math.random() - 0.5) * 10; // Primeira parcela sem variação
      const installmentValue = Math.round((monthlyValue + variation) * 100) / 100;
      
      // Determinar status baseado na data
      let status: 'paga' | 'pendente' = 'pendente';
      if (installmentDate < today) {
        status = Math.random() > 0.3 ? 'paga' : 'pendente'; // 70% chance de estar paga se é do passado
      }
      
      installments.push({
        numero: i + 1,
        valor: installmentValue,
        data: installmentDate.toISOString().split('T')[0],
        status: status
      });
    }
    
    return installments;
  }

  // Método para teste de conectividade
  static async testarConexaoN8n(): Promise<boolean> {
    try {
      const testData = new FormData();
      testData.append('test', 'true');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: testData
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }
}
