
import { DynamicPDFData } from '@/types/pdfUpload';
import { N8NDataConverter, N8NDirectData } from '@/utils/parsers/n8nDataConverter';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface N8NDirectResponse {
  success: boolean;
  message?: string;
  data?: N8NDirectData[];
  error?: string;
}

interface N8NWebhookResponse {
  success: boolean;
  policies: ParsedPolicyData[];
  message: string;
  totalProcessed: number;
}

export class N8NWebhookService {
  private static readonly WEBHOOK_URL = 'https://smartapolicetest.app.n8n.cloud/webhook/upload-arquivo';
  
  static async processarPdfComN8n(file: File, userId?: string): Promise<N8NWebhookResponse> {
    console.log(`🌐 Enviando PDF para processamento N8N: ${file.name}`);
    console.log(`👤 UserId fornecido: ${userId}`);
    
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para processamento N8N');
      throw new Error('userId é obrigatório para processar PDF via N8N');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', userId); // CRÍTICO: Enviar userId para o N8N
      formData.append('filename', file.name);

      console.log('📤 Enviando para webhook N8N:', this.WEBHOOK_URL);

      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log(`📡 Response status N8N: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta do N8N:', errorText);
        throw new Error(`Erro do webhook N8N: ${response.status} - ${errorText}`);
      }

      const result: N8NDirectResponse = await response.json();
      console.log('📋 Resultado do N8N:', result);

      if (!result.success || !result.data || !Array.isArray(result.data)) {
        console.error('❌ Resposta inválida do N8N:', result);
        throw new Error(result.error || 'Resposta inválida do webhook N8N');
      }

      // Converter dados do N8N para ParsedPolicyData
      const convertedPolicies: ParsedPolicyData[] = [];

      for (const policyData of result.data) {
        try {
          console.log('🔄 Convertendo política N8N:', {
            segurado: policyData.segurado,
            numero_apolice: policyData.numero_apolice,
            user_id_original: policyData.user_id,
            user_id_override: userId
          });

          const convertedPolicy = N8NDataConverter.convertN8NDirectData(
            policyData,
            file.name,
            file,
            userId // CRÍTICO: Passar userId como override
          );

          convertedPolicies.push(convertedPolicy);
          console.log('✅ Política convertida com sucesso:', convertedPolicy.id);

        } catch (conversionError) {
          console.error('❌ Erro na conversão da política:', conversionError);
          // Continuar com as outras políticas mesmo se uma falhar
        }
      }

      if (convertedPolicies.length === 0) {
        console.warn('⚠️ Nenhuma política foi convertida com sucesso');
        throw new Error('Nenhuma política pôde ser processada pelos dados do N8N');
      }

      console.log(`✅ N8N processamento concluído: ${convertedPolicies.length} políticas`);

      return {
        success: true,
        policies: convertedPolicies,
        message: `${convertedPolicies.length} apólices processadas com sucesso`,
        totalProcessed: convertedPolicies.length
      };

    } catch (error) {
      console.error('❌ Erro no processamento N8N:', error);
      throw error;
    }
  }

  // Método para processar dados N8N já recebidos (sem upload)
  static async processN8NData(data: N8NDirectData[], userId: string): Promise<ParsedPolicyData[]> {
    console.log('🔄 Processando dados N8N recebidos:', data.length, 'itens');

    if (!userId) {
      throw new Error('userId é obrigatório para processar dados N8N');
    }

    const convertedPolicies: ParsedPolicyData[] = [];

    for (const policyData of data) {
      try {
        const convertedPolicy = N8NDataConverter.convertN8NDirectData(
          policyData,
          'dados-n8n',
          undefined,
          userId
        );

        convertedPolicies.push(convertedPolicy);
      } catch (error) {
        console.error('❌ Erro na conversão de dados N8N:', error);
      }
    }

    console.log(`✅ Processamento N8N concluído: ${convertedPolicies.length} políticas`);
    return convertedPolicies;
  }
}
