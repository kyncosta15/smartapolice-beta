import { supabase } from '@/integrations/supabase/client';

// Configuração de URLs do N8N
const N8N_BASE_URL = 'https://oficialsmartapolice.app.n8n.cloud';

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

        // Salvar dados nas tabelas de frota do Supabase
        console.log('=== VERIFICANDO SE DEVE SALVAR NO SUPABASE ===');
        console.log('result.veiculos existe?:', !!result.veiculos);
        console.log('É array?:', Array.isArray(result.veiculos));
        console.log('Quantidade:', result.veiculos?.length || 0);
        
        if (result.veiculos && Array.isArray(result.veiculos) && result.veiculos.length > 0) {
          console.log('✅ Condições atendidas - iniciando salvamento no Supabase...');
          await this.saveFleetDataToSupabase(result, metadata);
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

  private static async saveFleetDataToSupabase(n8nResponse: N8NResponse, metadata?: N8NUploadMetadata) {
    try {
      console.log('=== SALVANDO DADOS DA FROTA NO SUPABASE ===');
      console.log('Resposta N8N completa:', JSON.stringify(n8nResponse, null, 2));
      console.log('Metadata recebida:', metadata);
      
      // Buscar empresa_id do usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Erro de autenticação:', userError);
        throw new Error('Usuário não autenticado');
      }

      console.log('Usuário autenticado:', user.id);

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userDataError || !userData?.company) {
        console.error('Erro ao buscar dados do usuário:', userDataError);
        throw new Error('Empresa do usuário não encontrada');
      }

      console.log('Empresa do usuário:', userData.company);

      // Buscar empresa_id baseado no nome da empresa do usuário
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userData.company)
        .maybeSingle();
        
      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError);
        throw new Error('Erro ao buscar empresa');
      }

      let empresaId: string;
      
      if (empresa) {
        empresaId = empresa.id;
        console.log('✅ Empresa encontrada:', empresaId);
      } else {
        console.log('❌ Empresa não encontrada, criando nova...');
        const { data: novaEmpresa, error: novaEmpresaError } = await supabase
          .from('empresas')
          .insert([{
            nome: userData.company,
            cnpj: metadata?.cnpj || null,
          }])
          .select('id')
          .single();
          
        if (novaEmpresaError || !novaEmpresa) {
          console.error('Erro ao criar empresa:', novaEmpresaError);
          throw new Error('Não foi possível criar a empresa');
        }
        
        empresaId = novaEmpresa.id;
        console.log('✅ Nova empresa criada:', empresaId);
      }

      // Processar cada veículo
      console.log(`🚗 Processando ${n8nResponse.veiculos.length} veículos...`);
      let sucessos = 0;
      let erros = 0;
      
      for (let i = 0; i < n8nResponse.veiculos.length; i++) {
        const veiculo = n8nResponse.veiculos[i];
        console.log(`\n[${i + 1}/${n8nResponse.veiculos.length}] 🔄 Processando veículo:`, veiculo.placa || 'SEM PLACA');

        try {
          // Preparar dados do veículo - MAPEAR TODOS OS CAMPOS DO N8N
          const categoria = this.mapCategoria(veiculo.familia);
          const statusSeguro = veiculo.status === 'ativo' ? 'segurado' : 'sem_seguro';
          
          const veiculoData = {
            empresa_id: empresaId,
            placa: veiculo.placa || `VEICULO-${i + 1}`,
            renavam: veiculo.renavam || null,
            marca: veiculo.marca || this.extractMarcaFromModelo(veiculo.modelo || 'Não informado'),
            modelo: veiculo.modelo || 'Não informado',
            ano_modelo: veiculo.ano ? Number(veiculo.ano) : null,
            chassi: veiculo.chassi || null,
            categoria: categoria,
            codigo: veiculo.codigo || null,
            localizacao: veiculo.localizacao || null,
            status_seguro: statusSeguro,
            status_veiculo: veiculo.status || 'ativo',
            proprietario_tipo: 'pj',
            proprietario_nome: veiculo.proprietario || n8nResponse.empresa?.nome || userData.company,
            proprietario_doc: n8nResponse.empresa?.cnpj || metadata?.cnpj,
            origem_planilha: veiculo.origem_planilha || null,
            observacoes: veiculo.origem_planilha ? `Importado do N8N - ${veiculo.origem_planilha} (${veiculo.familia || 'sem categoria'})` : null,
          };

          console.log('📋 Dados do veículo para inserir:', veiculoData);

          // Inserir veículo
          const { data: veiculoInserido, error: veiculoError } = await supabase
            .from('frota_veiculos')
            .insert([veiculoData])
            .select('id')
            .single();

          if (veiculoError) {
            console.error('❌ Erro ao inserir veículo:', veiculoError);
            console.error('📋 Dados que causaram erro:', veiculoData);
            erros++;
            continue;
          }

          const veiculoId = veiculoInserido.id;
          console.log('✅ Veículo inserido com sucesso:', veiculoId);
          sucessos++;

          // Inserir responsável se houver informação
          if (veiculo.localizacao) {
            const { error: responsavelError } = await supabase
              .from('frota_responsaveis')
              .insert([{
                veiculo_id: veiculoId,
                nome: `Responsável - ${veiculo.localizacao}`,
              }]);
              
            if (responsavelError) {
              console.error('⚠️ Erro ao inserir responsável:', responsavelError);
            } else {
              console.log('👤 Responsável inserido para veículo:', veiculoId);
            }
          }

          // Inserir pagamento de seguro se ativo
          if (veiculo.status === 'ativo') {
            const proximoVencimento = new Date();
            proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
            
            const { error: pagamentoError } = await supabase
              .from('frota_pagamentos')
              .insert([{
                veiculo_id: veiculoId,
                tipo: 'seguro',
                valor: 500,
                vencimento: proximoVencimento.toISOString().split('T')[0],
                status: 'pendente',
                observacoes: `Importado do N8N - ${veiculo.familia || 'categoria não informada'}`,
              }]);
              
            if (pagamentoError) {
              console.error('⚠️ Erro ao inserir pagamento:', pagamentoError);
            } else {
              console.log('💰 Pagamento inserido para veículo:', veiculoId);
            }
          }
        } catch (err) {
          console.error(`❌ Erro geral ao processar veículo ${i + 1}:`, err);
          erros++;
        }
      }

      console.log(`\n🎉 RESUMO DO SALVAMENTO:`);
      console.log(`✅ Sucessos: ${sucessos}`);
      console.log(`❌ Erros: ${erros}`);
      console.log(`📊 Total processado: ${sucessos + erros}`);
      
      if (sucessos > 0) {
        // Disparar evento para atualizar o dashboard
        window.dispatchEvent(new CustomEvent('frota-data-updated'));
        console.log('📡 Evento frota-data-updated disparado');
      }
      
    } catch (error: any) {
      console.error('💥 Erro geral ao salvar dados no Supabase:', error);
      throw new Error(`Falha ao salvar no banco: ${error.message}`);
    }
  }

  private static mapCategoria(familia: string): string {
    if (!familia) return 'outros';
    
    const familiaLower = familia.toLowerCase();
    
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