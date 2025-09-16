// Configuração de URLs do N8N
const N8N_BASE_URL = 'https://oficialsmartapolice.app.n8n.cloud';

// URLs para diferentes ambientes
export const N8N_URLS = {
  test: `${N8N_BASE_URL}/webhook-test/testewebhook2`,
  production: `${N8N_BASE_URL}/webhook/testewebhook2`
};

export interface N8NUploadMetadata {
  empresa_id?: string;
  empresa_nome?: string;
  cnpj?: string;
  user_id?: string;
  razao_social?: string;
  seguradora?: string;
  numero_apolice?: string;
  inicio_vigencia?: string;
  fim_vigencia?: string;
}

export interface N8NResponse {
  empresa: {
    id: string;
    nome: string;
    cnpj: string;
  };
  apolice: {
    numero_apolice: string;
    status: string;
    [key: string]: any;
  };
  veiculos: Array<{
    placa: string;
    chassi: string;
    modelo: string;
    familia: string;
    localizacao: string;
    status: string;
    [key: string]: any;
  }>;
  metrics: {
    totalLinhas: number;
    totalVeiculos: number;
    porFamilia: Record<string, number>;
    porLocalizacao: Record<string, number>;
    processadoEm: string;
  };
}

export class N8NUploadService {
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly ACCEPTED_EXTENSIONS = /\.(xlsx|csv|pdf)$/i;
  private static readonly RETRY_COUNT = 1;

  static validateFile(file: File): { valid: boolean; error?: string } {
    // Validar extensão
    if (!this.ACCEPTED_EXTENSIONS.test(file.name)) {
      return {
        valid: false,
        error: 'Formato inválido. Envie arquivos .xlsx, .csv ou .pdf'
      };
    }

    // Validar tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  static async uploadToN8N(
    file: File,
    metadata?: N8NUploadMetadata,
    environment: 'test' | 'production' = 'test'
  ): Promise<N8NResponse> {
    const url = N8N_URLS[environment];
    
    console.log('=== UPLOAD PARA N8N ===');
    console.log('Ambiente:', environment);
    console.log('URL:', url);
    console.log('Arquivo:', file.name, `(${file.size} bytes, ${file.type})`);
    console.log('Metadata:', metadata);

    // Preparar FormData
    const formData = new FormData();
    
    // CAMPO OBRIGATÓRIO: file
    formData.append('file', file, file.name);
    
    // Adicionar metadados opcionais
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
    }

    // Log do FormData
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    }

    let lastError: Error;
    
    // Tentar com retry
    for (let attempt = 0; attempt <= this.RETRY_COUNT; attempt++) {
      try {
        console.log(`Tentativa ${attempt + 1}/${this.RETRY_COUNT + 1}`);
        
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          // NÃO definir Content-Type - deixar o browser definir com boundary
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log('Status da resposta:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          
          // Se é erro 5xx e ainda temos tentativas, continuar o loop
          if (response.status >= 500 && attempt < this.RETRY_COUNT) {
            console.log('Erro 5xx - tentando novamente...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // delay 1s
            continue;
          }
          
          // Para outros erros ou se esgotaram as tentativas
          let errorMessage = `Upload falhou (${response.status})`;
          
          if (response.status === 404) {
            errorMessage += ': Webhook não encontrado. Verifique se está no modo correto (test vs prod)';
          } else if (response.status === 400) {
            errorMessage += `: Dados inválidos - ${errorText || response.statusText}`;
          } else if (response.status === 403) {
            errorMessage += ': Acesso negado ao webhook';
          } else if (response.status >= 500) {
            errorMessage += ': Erro interno do servidor N8N';
          } else {
            errorMessage += `: ${errorText || response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        // Ler resposta
        const responseText = await response.text();
        console.log('Resposta raw (primeiros 500 chars):', responseText.substring(0, 500));

        if (!responseText || responseText.trim() === '') {
          throw new Error('Resposta vazia do servidor N8N. Verifique se o webhook está em modo correto (test vs prod) e se o campo do arquivo é "file".');
        }

        let result: N8NResponse;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Erro ao fazer parse do JSON:', parseError);
          throw new Error(`Resposta inválida do servidor N8N. Resposta recebida: ${responseText.substring(0, 200)}...`);
        }

        console.log('Resposta processada:', result);
        return result;

      } catch (error: any) {
        lastError = error;
        
        // Se é erro de rede e ainda temos tentativas
        if (error.name === 'TypeError' && error.message.includes('fetch') && attempt < this.RETRY_COUNT) {
          console.log('Erro de rede - tentando novamente...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Se não é um erro que devemos repetir, ou esgotamos tentativas
        break;
      }
    }

    // Se chegou aqui, esgotaram as tentativas
    console.error('Todas as tentativas falharam. Último erro:', lastError);
    throw lastError;
  }

  static async testConnection(environment: 'test' | 'production' = 'test'): Promise<boolean> {
    try {
      const url = N8N_URLS[environment];
      const response = await fetch(url, {
        method: 'OPTIONS', // preflight
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.ok || response.status === 405; // 405 pode ser OK (método não permitido mas endpoint existe)
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }
}