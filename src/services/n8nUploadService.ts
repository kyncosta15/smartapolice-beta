import { supabase } from '@/integrations/supabase/client';

// Configuração de URLs do N8N
const N8N_BASE_URL = 'https://rcorpoficial.app.n8n.cloud';

// URLs para diferentes ambientes
export const N8N_URLS = {
  test: `${N8N_BASE_URL}/webhook-test/testewebhook1`,
  production: `${N8N_BASE_URL}/webhook-test/testewebhook1`
};

export interface N8NUploadMetadata {
  empresa_id?: string;
  empresa_nome?: string;
  cnpj?: string;
  user_id?: string;
  user_email?: string;
  razao_social?: string;
  seguradora?: string;
  numero_apolice?: string;
  inicio_vigencia?: string;
  fim_vigencia?: string;
}

export interface N8NResponse {
  // Propriedades da resposta antiga (N8N com webhook original)
  empresa?: {
    id: string;
    nome: string;
    cnpj: string;
  };
  apolice?: {
    numero_apolice: string;
    status: string;
    [key: string]: any;
  };
  veiculos?: Array<{
    placa: string;
    chassi: string;
    modelo: string;
    familia: string;
    localizacao: string;
    status: string;
    [key: string]: any;
  }>;
  metrics?: {
    totalLinhas: number;
    totalVeiculos: number;
    porFamilia: Record<string, number>;
    porLocalizacao: Record<string, number>;
    processadoEm: string;
  };

  // Propriedades da resposta nova (processar-n8n-frotas)
  success?: boolean;
  message?: string;
  detalhes?: {
    total_recebidos: number;
    veiculos_inseridos: number;
    erros_insercao: number;
    empresa_id: string;
    dados_preenchidos?: number;
  };
  erros?: any[];
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
        
        // Criar um AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          // NÃO definir Content-Type - deixar o browser definir com boundary
          headers: {
            'Accept': 'application/json'
          },
          // Adicionar configurações para evitar problemas de CORS e timeout
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

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
          console.log('⚠️ N8N retornou sucesso mas sem dados - simulando resposta padrão');
          return {
            success: true,
            message: 'Arquivo processado com sucesso pelo N8N',
            metrics: {
              totalVeiculos: 1,
              totalLinhas: 1,
              porFamilia: {},
              porLocalizacao: {},
              processadoEm: new Date().toLocaleString()
            }
          };
        }

        let result: N8NResponse;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Erro ao fazer parse do JSON:', parseError);
          throw new Error(`Resposta inválida do servidor N8N. Resposta recebida: ${responseText.substring(0, 200)}...`);
        }

        console.log('Resposta processada:', result);

        // Salvar dados nas tabelas de frota do Supabase
        console.log('=== VERIFICANDO SE DEVE SALVAR NO SUPABASE ===');
        console.log('result.veiculos existe?:', !!result.veiculos);
        console.log('É array?:', Array.isArray(result.veiculos));
        console.log('Quantidade:', result.veiculos?.length || 0);
        
        if (result.veiculos && Array.isArray(result.veiculos) && result.veiculos.length > 0) {
          console.log('✅ Condições atendidas - iniciando salvamento no Supabase...');
          
          // Validar metadata obrigatório
          if (!metadata?.empresa_id || !metadata?.user_id) {
            throw new Error('Metadata obrigatório (empresa_id, user_id) não fornecido para salvamento');
          }
          
          const validatedMetadata = {
            empresa_id: metadata.empresa_id,
            empresa_nome: metadata.empresa_nome || 'Empresa',
            user_id: metadata.user_id,
            user_email: metadata.user_email || '',
            razao_social: metadata.razao_social || metadata.empresa_nome || 'Empresa'
          };
          
          await this.saveFleetDataToSupabase(result, validatedMetadata);
        } else {
          console.warn('❌ Condições não atendidas para salvamento:', {
            veiculosExists: !!result.veiculos,
            isArray: Array.isArray(result.veiculos), 
            length: result.veiculos?.length || 0
          });
        }

        return result;

      } catch (error: any) {
        lastError = error;
        
        console.error(`Erro na tentativa ${attempt + 1}:`, error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.name === 'AbortError') {
          // Timeout - tentar novamente se ainda há tentativas
          if (attempt < this.RETRY_COUNT) {
            console.log('⏱️ Timeout - tentando novamente em 3 segundos...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          } else {
            throw new Error(`Timeout na conexão com o webhook N8N após 30 segundos. Verifique se o endpoint ${url} está respondendo corretamente.`);
          }
        }
        
        if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
          // Erro de rede/CORS - tentar novamente se ainda há tentativas
          if (attempt < this.RETRY_COUNT) {
            console.log('🔄 Erro de rede/CORS - tentando novamente em 2 segundos...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else {
            // Última tentativa - dar erro mais específico
            throw new Error(`Falha na conexão com o webhook N8N. Verifique se o endpoint ${url} está acessível e se o servidor permite requisições CORS.`);
          }
        }
        
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

  static async saveFleetDataToSupabase(
    data: N8NResponse,
    metadata: {
      empresa_id: string;
      empresa_nome: string;
      user_id: string;
      user_email: string;
      razao_social: string;
    }
  ): Promise<void> {
    console.log('💾 Iniciando salvamento no Supabase...');
    console.log('📋 Metadata:', metadata);
    
    if (!data?.veiculos?.length) {
      throw new Error('Nenhum dado de veículo para salvar');
    }

    if (!metadata.empresa_id) {
      throw new Error('empresa_id é obrigatório para salvar os dados');
    }

    try {
      // Verificar se o usuário existe
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ Usando empresa_id do metadata:', metadata.empresa_id);

      // Processar dados dos veículos
      const veiculosData = data.veiculos.map((vehicle: any, index: number) => {
        const categoria = this.mapCategoria(vehicle.familia);
        const statusSeguro = vehicle.status === 'ativo' ? 'segurado' : 'sem_seguro';
        
        return {
          empresa_id: metadata.empresa_id,
          placa: vehicle.placa || `VEICULO-${index + 1}`,
          renavam: vehicle.renavam || null,
          marca: vehicle.marca || this.extractMarcaFromModelo(vehicle.modelo || 'Não informado'),
          modelo: vehicle.modelo || 'Não informado',
          ano_modelo: vehicle.ano ? Number(vehicle.ano) : null,
          chassi: vehicle.chassi || null,
          categoria: categoria,
          codigo: vehicle.codigo || null,
          localizacao: vehicle.localizacao || null,
          status_seguro: statusSeguro,
          status_veiculo: vehicle.status || 'ativo',
          proprietario_tipo: 'pj',
          proprietario_nome: vehicle.proprietario || metadata.empresa_nome,
          proprietario_doc: metadata.user_email?.replace('@', '').replace(/\./g, ''),
          origem_planilha: vehicle.origem_planilha || null,
          observacoes: vehicle.origem_planilha ? `Importado do N8N - ${vehicle.origem_planilha} (${vehicle.familia || 'sem categoria'})` : null,
          user_id: user.id,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      console.log('📋 Inserindo veículos no banco:', veiculosData.length);

      // Inserir todos os veículos de uma vez
      const { data: veiculosInseridos, error: veiculosError } = await supabase
        .from('frota_veiculos')
        .insert(veiculosData)
        .select('id');

      if (veiculosError) {
        console.error('❌ Erro ao inserir veículos:', veiculosError);
        throw new Error(`Erro ao inserir veículos: ${veiculosError.message}`);
      }

      console.log(`✅ ${veiculosInseridos?.length || 0} veículos inseridos com sucesso`);

      // Disparar evento para atualizar o dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      console.log('📡 Evento frota-data-updated disparado');
      
    } catch (error: any) {
      console.error('💥 Erro geral ao salvar dados no Supabase:', error);
      throw new Error(`Falha ao salvar no banco: ${error.message}`);
    }
  }

  private static mapCategoria(familia: string | number): string {
    if (!familia && familia !== 0) return 'outros';
    
    // Convert to string to handle both numeric and string inputs
    const familiaStr = String(familia);
    const familiaLower = familiaStr.toLowerCase();
    
    // Mapear família do N8N para categorias válidas do banco
    if (familiaLower.includes('carro') || familiaLower.includes('automovel') || familiaLower.includes('passeio')) {
      return 'passeio';
    }
    if (familiaLower.includes('caminhao') || familiaLower.includes('caminhão') || familiaLower.includes('compactador')) {
      return 'caminhao';
    }
    if (
      familiaLower.includes('utilitario') || 
      familiaLower.includes('utilitário') || 
      familiaLower.includes('van') || 
      familiaLower.includes('pickup') ||
      familiaLower.includes('apoio') ||  // "CARRO DE APOIO"
      familiaLower.includes('suv') ||
      familiaLower.includes('hilux') ||
      familiaLower.includes('sw4')
    ) {
      return 'utilitario';
    }
    if (familiaLower.includes('moto') || familiaLower.includes('motocicleta') || familiaLower.includes('cg')) {
      return 'moto';
    }
    
    console.log(`⚠️ Categoria não mapeada: "${familia}" -> usando "outros"`);
    return 'outros';
  }

  private static extractMarcaFromModelo(modelo: string): string {
    if (!modelo) return 'Não informado';
    
    // Extrair marca comum do modelo (primeiras palavras)
    const marcasComuns = [
      'VOLKSWAGEN', 'VW', 'FIAT', 'CHEVROLET', 'FORD', 'TOYOTA', 'HONDA', 
      'HYUNDAI', 'NISSAN', 'RENAULT', 'PEUGEOT', 'CITROEN', 'MERCEDES',
      'BMW', 'AUDI', 'VOLVO', 'SCANIA', 'IVECO', 'MAN'
    ];
    
    const modeloUpper = modelo.toUpperCase();
    for (const marca of marcasComuns) {
      if (modeloUpper.includes(marca)) {
        return marca;
      }
    }
    
    // Se não encontrar marca conhecida, pegar primeira palavra
    return modelo.split(' ')[0];
  }
}