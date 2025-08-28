
export class DynamicPDFExtractor {
  private static readonly WEBHOOK_URL = 'https://smartapolicetest.app.n8n.cloud/webhook/upload-arquivo';
  private static readonly TIMEOUT = 120000;
  private static readonly MAX_RETRIES = 2;

  static async extractFromMultiplePDFs(files: File[], userId: string): Promise<any[]> {
    console.log(`🚀 DynamicPDFExtractor processando ${files.length} arquivos`);
    console.log(`👤 UserId: ${userId}`);

    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório');
      throw new Error('userId é obrigatório para extração de PDF');
    }

    try {
      // Importar N8NWebhookService dinamicamente para evitar dependências circulares
      const { N8NWebhookService } = await import('./n8nWebhookService');
      
      const allResults: any[] = [];

      // Processar arquivos sequencialmente para evitar sobrecarga
      for (const file of files) {
        try {
          console.log(`📄 Processando arquivo: ${file.name}`);
          
          const result = await N8NWebhookService.processarPdfComN8n(file, userId);
          
          if (result.success && result.policies) {
            console.log(`✅ Arquivo ${file.name} processado: ${result.policies.length} políticas`);
            allResults.push(...result.policies);
          } else {
            console.warn(`⚠️ Arquivo ${file.name} não retornou políticas válidas`);
          }

        } catch (fileError) {
          console.error(`❌ Erro processando ${file.name}:`, fileError);
          // Continuar com próximo arquivo mesmo se um falhar
        }

        // Pequeno delay entre arquivos para não sobrecarregar o webhook
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`🎉 Extração concluída: ${allResults.length} políticas extraídas`);
      return allResults;

    } catch (error) {
      console.error('❌ Erro na extração via N8N:', error);
      
      // Em caso de erro total, retornar array vazio para permitir fallback
      console.log('🔄 Retornando array vazio para permitir fallback');
      return [];
    }
  }

  // Método legado mantido para compatibilidade
  static async extractPolicyData(file: File, userId?: string): Promise<any> {
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    const results = await this.extractFromMultiplePDFs([file], userId);
    return results.length > 0 ? results[0] : null;
  }
}
