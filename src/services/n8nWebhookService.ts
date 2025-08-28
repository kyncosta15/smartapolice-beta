
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
  private static readonly TIMEOUT = 180000; // 3 minutos
  private static readonly MAX_RETRIES = 2;
  
  // FUNÇÃO PRINCIPAL: Processar PDF com N8N webhook
  static async processarPdfComN8n(file: File, userId?: string): Promise<N8NWebhookResponse> {
    console.log(`🌐 ATIVANDO WEBHOOK N8N: ${file.name}`);
    console.log(`🔗 URL do webhook: ${this.WEBHOOK_URL}`);
    console.log(`👤 UserId: ${userId}`);
    
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para webhook N8N');
      throw new Error('userId é obrigatório para processar PDF via webhook N8N');
    }

    let retryCount = 0;
    
    while (retryCount <= this.MAX_RETRIES) {
      try {
        console.log(`🚀 Tentativa ${retryCount + 1}/${this.MAX_RETRIES + 1} - Enviando para webhook N8N`);
        
        // Preparar FormData para o webhook
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        formData.append('filename', file.name);

        console.log('📤 Enviando dados para webhook N8N:', {
          url: this.WEBHOOK_URL,
          fileName: file.name,
          fileSize: file.size,
          userId: userId
        });

        // Criar AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(this.WEBHOOK_URL, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Response do webhook N8N: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Erro na resposta do webhook N8N:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          
          if (retryCount < this.MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Tentando novamente em 2 segundos... (${retryCount}/${this.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          throw new Error(`Webhook N8N falhou: ${response.status} - ${errorText}`);
        }

        const result: N8NDirectResponse = await response.json();
        console.log('📋 Resposta completa do webhook N8N:', result);

        if (!result.success) {
          console.error('❌ Webhook N8N retornou falha:', result);
          
          if (retryCount < this.MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Tentando novamente... (${retryCount}/${this.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          throw new Error(result.error || result.message || 'Webhook N8N retornou falha');
        }

        if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
          console.error('❌ Webhook N8N não retornou dados válidos:', result);
          throw new Error('Webhook N8N não retornou dados de apólices válidos');
        }

        console.log(`✅ Webhook N8N processou com sucesso: ${result.data.length} apólices encontradas`);

        // Converter dados do N8N para formato da aplicação
        const convertedPolicies: ParsedPolicyData[] = [];

        for (const policyData of result.data) {
          try {
            console.log('🔄 Convertendo apólice do N8N:', {
              segurado: policyData.segurado,
              numero_apolice: policyData.numero_apolice,
              premio: policyData.premio,
              seguradora: policyData.seguradora
            });

            const convertedPolicy = N8NDataConverter.convertN8NDirectData(
              policyData,
              file.name,
              file,
              userId
            );

            convertedPolicies.push(convertedPolicy);
            console.log('✅ Apólice convertida com sucesso:', convertedPolicy.id);

          } catch (conversionError) {
            console.error('❌ Erro na conversão da apólice:', conversionError);
            // Continuar com outras apólices mesmo se uma falhar
          }
        }

        if (convertedPolicies.length === 0) {
          throw new Error('Nenhuma apólice pôde ser processada pelos dados do webhook N8N');
        }

        console.log(`🎉 Webhook N8N processamento concluído: ${convertedPolicies.length} apólices processadas`);

        return {
          success: true,
          policies: convertedPolicies,
          message: `${convertedPolicies.length} apólices processadas via webhook N8N`,
          totalProcessed: convertedPolicies.length
        };

      } catch (error) {
        console.error(`❌ Erro na tentativa ${retryCount + 1} do webhook N8N:`, error);
        
        if (error.name === 'AbortError') {
          console.error('❌ Timeout do webhook N8N');
        }
        
        if (retryCount < this.MAX_RETRIES) {
          retryCount++;
          console.log(`🔄 Tentando novamente em 3 segundos... (${retryCount}/${this.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // Se todas as tentativas falharam
        throw error;
      }
    }

    // Este ponto nunca deve ser alcançado
    throw new Error('Falha em todas as tentativas do webhook N8N');
  }

  // Processar dados N8N diretos (sem upload)
  static async processN8NData(data: N8NDirectData[], userId: string): Promise<ParsedPolicyData[]> {
    console.log('🔄 Processando dados N8N diretos:', data.length, 'itens');

    if (!userId) {
      throw new Error('userId é obrigatório para processar dados N8N');
    }

    const convertedPolicies: ParsedPolicyData[] = [];

    for (const policyData of data) {
      try {
        const convertedPolicy = N8NDataConverter.convertN8NDirectData(
          policyData,
          'dados-n8n-diretos',
          undefined,
          userId
        );

        convertedPolicies.push(convertedPolicy);
      } catch (error) {
        console.error('❌ Erro na conversão de dados N8N diretos:', error);
        throw error;
      }
    }

    console.log(`✅ Processamento N8N direto concluído: ${convertedPolicies.length} políticas`);
    return convertedPolicies;
  }
}
