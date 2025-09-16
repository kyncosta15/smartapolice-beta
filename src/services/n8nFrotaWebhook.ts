import { supabase } from '@/integrations/supabase/client';
import { FrotaVeiculo } from '@/hooks/useFrotasData';

const N8N_WEBHOOK_URL = 'https://oficialsmartapolice.app.n8n.cloud/webhook-test/testewebhook1';

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
      
      // Adicionar cada arquivo com chaves diferentes para o N8N identificar
      files.forEach((file, index) => {
        formData.append('file', file, file.name); // N8N espera 'file' como campo
        console.log(`Adicionando arquivo ${index}: ${file.name}, tamanho: ${file.size} bytes`);
      });
      
      // Metadados adicionais
      formData.append('company', userCompany);
      formData.append('timestamp', new Date().toISOString());
      formData.append('action', 'process_frota');
      formData.append('fileCount', files.length.toString());

      console.log('=== ENVIANDO PARA N8N ===');
      console.log('URL:', N8N_WEBHOOK_URL);
      console.log('Total de arquivos:', files.length);
      console.log('Empresa:', userCompany);
      
      // Chamar webhook N8N com headers apropriados
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        // NÃO definir Content-Type - deixar o browser definir automaticamente para multipart
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('Status da resposta:', response.status, response.statusText);
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta HTTP:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Aguardar resposta com timeout adequado
      const responseText = await response.text();
      console.log('=== RESPOSTA DO N8N ===');
      console.log('Tamanho da resposta:', responseText.length, 'caracteres');
      console.log('Primeiros 200 chars:', responseText.substring(0, 200));

      if (!responseText || responseText.trim() === '') {
        throw new Error('Resposta vazia do servidor N8N. Verifique se o webhook está configurado corretamente.');
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('JSON parseado com sucesso:', result);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        console.error('Conteúdo completo da resposta:', responseText);
        
        // Se não conseguir fazer parse, mas houve resposta, considerar como sucesso básico
        result = {
          success: true,
          data: [{
            message: 'Arquivo processado pelo N8N',
            raw_response: responseText.substring(0, 500)
          }],
          message: 'Processamento concluído (resposta não-JSON)'
        };
      }

      // Normalizar estrutura da resposta
      if (!result || typeof result !== 'object') {
        result = {
          success: false,
          data: [],
          message: 'Resposta inesperada do servidor N8N'
        };
      }

      // Garantir que existe array de dados
      if (!result.data || !Array.isArray(result.data)) {
        result.data = [];
      }

      // Se temos dados válidos, inserir no banco
      if (result.success && result.data.length > 0) {
        console.log('Inserindo dados no banco...', result.data.length, 'registros');
        await this.inserirVeiculosNoBanco(result.data, userCompany);
      }

      return result;
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      
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
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano_modelo: veiculo.ano_modelo ? parseInt(veiculo.ano_modelo) : null,
        categoria: veiculo.categoria || 'automovel',
        proprietario_tipo: veiculo.proprietario_tipo || 'pf',
        proprietario_doc: veiculo.proprietario_doc || veiculo.cpf_cnpj,
        proprietario_nome: veiculo.proprietario_nome || veiculo.nome_proprietario,
        uf_emplacamento: veiculo.uf || veiculo.uf_emplacamento,
        data_venc_emplacamento: veiculo.data_venc_emplacamento,
        status_seguro: veiculo.status_seguro || 'pendente_analise',
        preco_fipe: veiculo.preco_fipe ? parseFloat(veiculo.preco_fipe) : null,
        preco_nf: veiculo.preco_nf ? parseFloat(veiculo.preco_nf) : null,
        percentual_tabela: veiculo.percentual_tabela ? parseFloat(veiculo.percentual_tabela) : null,
        modalidade_compra: veiculo.modalidade_compra || 'indefinido',
        consorcio_grupo: veiculo.consorcio_grupo,
        consorcio_cota: veiculo.consorcio_cota,
        consorcio_taxa_adm: veiculo.consorcio_taxa_adm ? parseFloat(veiculo.consorcio_taxa_adm) : null,
        data_venc_ultima_parcela: veiculo.data_venc_ultima_parcela,
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