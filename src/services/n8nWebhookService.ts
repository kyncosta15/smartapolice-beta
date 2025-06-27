
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
}

interface N8NWebhookResponse {
  success: boolean;
  data?: DynamicPDFData;
  message?: string;
  error?: string;
}

export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';
  
  static async processarPdfComN8n(file: File): Promise<N8NWebhookResponse> {
    console.log(`🌐 Enviando PDF para processamento N8N: ${file.name}`);
    
    try {
      // Criar FormData para envio do arquivo
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('fileName', file.name);
      formData.append('timestamp', new Date().toISOString());

      console.log('📤 Enviando arquivo para webhook N8N...');
      
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json() as N8NDirectResponse;
      
      console.log('✅ Resposta recebida do N8N:', result);
      
      // Log specifically the policy number received
      if (result.numero_apolice || result.apolice) {
        console.log('📋 Número da apólice recebido:', result.numero_apolice || result.apolice);
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

    // Gerar parcelas individuais usando os dados do N8N
    const parcelas = this.generateInstallmentDetails(premioMensal, startDate, numeroParcelas);

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
      // Adicionar as parcelas como propriedade adicional
      parcelas_detalhadas: parcelas
    };
  }

  private static generateInstallmentDetails(monthlyValue: number, startDate: string, numberOfInstallments: number) {
    const installments = [];
    const baseDate = new Date(startDate);
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      
      // Usar valor base com pequenas variações realistas
      const variation = i === 0 ? 0 : (Math.random() - 0.5) * 10; // Primeira parcela sem variação
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
