import { supabase } from '@/integrations/supabase/client';
import { FrotaVeiculo } from '@/hooks/useFrotasData';

const N8N_WEBHOOK_URL = 'https://rcorpoficial.app.n8n.cloud/webhook-test/testewebhook1';

export interface N8NFrotaResponse {
  success: boolean;
  data: any[];
  message?: string;
}

export class N8NFrotaWebhookService {
  static async processarDadosFrota(files: File[], userCompany: string): Promise<N8NFrotaResponse> {
    try {
      // Preparar dados para envio como multipart/form-data
      const formData = new FormData();
      
      // N8N espera arquivos no campo 'data' para webhook binário
      files.forEach((file, index) => {
        console.log(`Preparando arquivo ${index}: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);
        // Para N8N webhook binário, usar 'data' como campo principal
        formData.append('data', file, file.name);
      });
      
      // Metadados como campos separados
      formData.append('company', userCompany);
      formData.append('timestamp', new Date().toISOString());
      formData.append('action', 'process_frota');
      formData.append('fileCount', files.length.toString());

      console.log('=== ENVIANDO PARA N8N WEBHOOK BINÁRIO ===');
      console.log('URL:', N8N_WEBHOOK_URL);
      console.log('Total de arquivos:', files.length);
      console.log('Empresa:', userCompany);
      console.log('FormData entries:');
      
      // Log dos dados do FormData
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`- ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`- ${key}: ${value}`);
        }
      }
      
      // Chamar webhook N8N sem headers customizados (deixar o browser definir)
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type - o browser define automaticamente com boundary correto
      });

      console.log('=== RESPOSTA DO SERVIDOR ===');
      console.log('Status:', response.status, response.statusText);
      console.log('Headers de resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta HTTP:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Tentar ler resposta como texto primeiro
      const responseText = await response.text();
      console.log('=== CONTEÚDO DA RESPOSTA ===');
      console.log('Tamanho:', responseText.length, 'caracteres');
      console.log('Conteúdo (primeiros 500 chars):', responseText.substring(0, 500));

      if (!responseText || responseText.trim() === '') {
        // Se resposta vazia, considerar como sucesso (N8N pode não retornar JSON)
        console.log('Resposta vazia - assumindo processamento bem-sucedido');
        return {
          success: true,
          data: files.map((file, index) => ({
            arquivo: file.name,
            status: 'processado',
            index: index,
            message: 'Arquivo enviado para N8N'
          })),
          message: `${files.length} arquivo(s) enviado(s) com sucesso para processamento`
        };
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('JSON parseado com sucesso:', result);
      } catch (parseError) {
        console.log('Resposta não é JSON válido - tratando como sucesso');
        
        // Se não é JSON, mas houve resposta, considerar sucesso
        return {
          success: true,
          data: files.map((file, index) => ({
            arquivo: file.name,
            status: 'processado',
            index: index,
            raw_response: responseText.substring(0, 200),
            message: 'Processado pelo N8N'
          })),
          message: `Arquivos processados. Resposta: ${responseText.substring(0, 100)}...`
        };
      }

      // Normalizar estrutura da resposta
      if (!result || typeof result !== 'object') {
        result = {
          success: true,
          data: [],
          message: 'Processamento concluído'
        };
      }

      // Garantir que existe array de dados
      if (!result.data || !Array.isArray(result.data)) {
        result.data = [];
      }

      // Se não há dados específicos, criar dados baseados nos arquivos enviados
      if (result.data.length === 0) {
        result.data = files.map((file, index) => ({
          arquivo: file.name,
          status: 'processado',
          index: index
        }));
      }

      return result;
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      
      // Se é erro de rede, dar uma mensagem mais específica
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error(`Erro de conexão com N8N: Verifique se o webhook ${N8N_WEBHOOK_URL} está acessível`);
      }
      
      throw new Error(`Erro ao processar dados: ${error.message}`);
    }
  }

  private static async inserirVeiculosNoBanco(dadosVeiculos: any[], userCompany: string) {
    try {
      // Buscar empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userCompany)
        .single();

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Converter dados do N8N para formato do banco
      const veiculosParaInserir = dadosVeiculos.map(veiculo => ({
        empresa_id: empresa.id,
        placa: veiculo.placa || '',
        renavam: veiculo.renavam,
        chassi: veiculo.chassi,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano_modelo: veiculo.ano ? parseInt(veiculo.ano) : (veiculo.ano_modelo ? parseInt(veiculo.ano_modelo) : null),
        categoria: veiculo.categoria || veiculo.familia || 'automovel',
        proprietario_tipo: veiculo.proprietario_tipo || 'pf',
        proprietario_doc: veiculo.proprietario_doc || veiculo.cpf_cnpj,
        proprietario_nome: veiculo.proprietario_nome || veiculo.proprietario || veiculo.nome_proprietario,
        uf_emplacamento: veiculo.uf || veiculo.uf_emplacamento,
        data_venc_emplacamento: veiculo.data_venc_emplacamento,
        status_seguro: veiculo.status_seguro || (veiculo.status === 'ativo' ? 'vigente' : 'pendente_analise'),
        preco_fipe: veiculo.preco_fipe ? parseFloat(veiculo.preco_fipe) : null,
        preco_nf: veiculo.preco_nf ? parseFloat(veiculo.preco_nf) : null,
        percentual_tabela: veiculo.percentual_tabela ? parseFloat(veiculo.percentual_tabela) : null,
        modalidade_compra: veiculo.modalidade_compra || 'indefinido',
        consorcio_grupo: veiculo.consorcio_grupo,
        consorcio_cota: veiculo.consorcio_cota,
        consorcio_taxa_adm: veiculo.consorcio_taxa_adm ? parseFloat(veiculo.consorcio_taxa_adm) : null,
        data_venc_ultima_parcela: veiculo.data_venc_ultima_parcela,
        localizacao: veiculo.localizacao,
        codigo: veiculo.codigo,
        origem_planilha: veiculo.origem_planilha,
        observacoes: veiculo.observacoes,
      }));

      // Inserir veículos
      const { data: veiculosInseridos, error: insertError } = await supabase
        .from('frota_veiculos')
        .insert(veiculosParaInserir)
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log(`${veiculosInseridos?.length || 0} veículos inseridos com sucesso`);

      // Inserir dados relacionados se existirem
      if (veiculosInseridos) {
        for (let i = 0; i < veiculosInseridos.length; i++) {
          const veiculo = veiculosInseridos[i];
          const dadosOriginais = dadosVeiculos[i];

          // Inserir responsáveis se existirem
          if (dadosOriginais.responsaveis && dadosOriginais.responsaveis.length > 0) {
            const responsaveis = dadosOriginais.responsaveis.map((resp: any) => ({
              veiculo_id: veiculo.id,
              nome: resp.nome,
              telefone: resp.telefone,
              cnh_numero: resp.cnh_numero,
              cnh_validade: resp.cnh_validade,
            }));

            await supabase
              .from('frota_responsaveis')
              .insert(responsaveis);
          }

          // Inserir pagamentos se existirem
          if (dadosOriginais.pagamentos && dadosOriginais.pagamentos.length > 0) {
            const pagamentos = dadosOriginais.pagamentos.map((pag: any) => ({
              veiculo_id: veiculo.id,
              tipo: pag.tipo || 'seguro',
              valor: parseFloat(pag.valor),
              vencimento: pag.vencimento,
              status: pag.status || 'pendente',
              observacoes: pag.observacoes,
            }));

            await supabase
              .from('frota_pagamentos')
              .insert(pagamentos);
          }
        }
      }

      return veiculosInseridos;
    } catch (error: any) {
      console.error('Erro ao inserir veículos no banco:', error);
      throw new Error(`Erro ao salvar dados: ${error.message}`);
    }
  }

  static async testarConexao(): Promise<boolean> {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão N8N:', error);
      return false;
    }
  }
}