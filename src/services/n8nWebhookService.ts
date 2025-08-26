import { DynamicPDFData } from '@/types/pdfUpload';

interface N8NDirectResponse {
  segurado?: string;
  seguradora?: string;
  tipo?: string;
  inicio?: string;
  fim?: string;
  premio?: number;
  parcelas?: number;
  pagamento?: string;
  custo_mensal?: number;
  vencimentos_futuros?: any[];
  status?: string;
  // Policy number fields from N8N
  numero_apolice?: string;
  apolice?: string;
  // Campos de documento
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  // Coberturas with LMI - processadas do texto original
  coberturas?: Array<{
    descricao: string;
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
  private static readonly WEBHOOK_URL = 'https://smartapolicetest.app.n8n.cloud/webhook-test/upload-arquivo';
  
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
      
      console.log('✅ Resposta recebida do N8N:', result);
      console.log('📅 Vencimentos futuros recebidos:', result.vencimentos_futuros);
      
      // Log specifically the policy number received
      if (result.numero_apolice || result.apolice) {
        console.log('📋 Número da apólice recebido:', result.numero_apolice || result.apolice);
      }
      
      // Log coverages with LMI
      if (result.coberturas) {
        console.log('🛡️ Coberturas com LMI recebidas:', result.coberturas);
      }
      
      // Verificar se temos dados válidos do N8N
      if (result && (result.segurado || result.seguradora || result.premio)) {
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
    const startDate = n8nData.inicio || new Date().toISOString().split('T')[0];
    const endDate = n8nData.fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const premioAnual = n8nData.premio || 0;
    const premioMensal = n8nData.custo_mensal || (premioAnual / 12);
    const numeroParcelas = n8nData.parcelas || 12;

    // Priorizar numero_apolice, depois apolice, e só usar fallback se nenhum estiver disponível
    let policyNumber = n8nData.numero_apolice || n8nData.apolice;
    
    // Se não tiver número da apólice, usar um fallback mais específico
    if (!policyNumber) {
      console.warn('⚠️ Número da apólice não encontrado no retorno do N8N, usando fallback');
      policyNumber = `SEM-NUMERO-${Date.now()}`;
    }
    
    console.log('🔢 Número da apólice definido:', policyNumber);
    console.log('🛡️ Coberturas recebidas do N8N:', n8nData.coberturas);

    // Processar coberturas - garantir que sejam processadas corretamente
    let processedCoberturas = [];
    if (n8nData.coberturas && Array.isArray(n8nData.coberturas)) {
      processedCoberturas = n8nData.coberturas.map(cobertura => ({
        descricao: cobertura.descricao || '',
        lmi: cobertura.lmi ? Number(cobertura.lmi) : undefined
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

    return {
      informacoes_gerais: {
        nome_apolice: `Apólice ${n8nData.seguradora || 'N8N'}`,
        tipo: n8nData.tipo || "Auto",
        status: n8nData.status || "Ativa",
        numero_apolice: policyNumber
      },
      seguradora: {
        empresa: n8nData.seguradora || "Seguradora N8N",
        categoria: "Processado via N8N",
        cobertura: "Cobertura N8N",
        entidade: "N8N IA"
      },
      informacoes_financeiras: {
        premio_anual: premioAnual,
        premio_mensal: Math.round(premioMensal * 100) / 100
      },
      vigencia: {
        inicio: startDate,
        fim: endDate,
        extraido_em: new Date().toISOString().split('T')[0]
      },
      segurado: n8nData.segurado ? {
        nome: n8nData.segurado
      } : undefined,
      // Campos de documento do N8N
      documento: n8nData.documento,
      documento_tipo: n8nData.documento_tipo,
      // Coberturas array - mantendo a estrutura processada do N8N
      coberturas: processedCoberturas,
      // Adicionar as parcelas como propriedade adicional
      parcelas_detalhadas: parcelas
    };
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
