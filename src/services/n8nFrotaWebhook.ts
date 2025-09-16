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
      // Preparar dados para envio
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      
      formData.append('company', userCompany);
      formData.append('timestamp', new Date().toISOString());

      // Chamar webhook N8N
      console.log('Enviando arquivos para N8N webhook:', N8N_WEBHOOK_URL);
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resposta do N8N:', result);

      // Processar dados recebidos e inserir no banco
      if (result.success && result.data) {
        await this.inserirVeiculosNoBanco(result.data, userCompany);
      }

      return result;
    } catch (error: any) {
      console.error('Erro ao processar webhook N8N:', error);
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