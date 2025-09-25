import { supabase } from '@/integrations/supabase/client';

/**
 * Simula o processamento dos dados enviados pelo N8N para testar a lógica
 */
export const testN8NDataProcessing = async () => {
  console.log('🧪 TESTE: Simulando dados do N8N para verificar processamento...');
  
  // Dados simulados baseados no JSON que o usuário enviou
  const simulatedN8NData = [
    {
      "empresa": {},
      "apolice": {
        "tipo_beneficio": "gestao_frotas",
        "status": "ativa"
      },
      "veiculos": [
        {
          "placa": "A1A1A1A1",
          "modelo": "FIAT",
          "chassi": "123456789",
          "renavam": "",
          "marca": "UNO",
          "ano": 2018,
          "proprietario": "THIAGO",
          "localizacao": "SALVADOR",
          "familia": 2,
          "status": "ativo",
          "origem_planilha": 1
        },
        {
          "codigo": "CAT083",
          "placa": "A1A1A1A2", 
          "modelo": "FIAT",
          "chassi": "123456780",
          "renavam": "",
          "marca": "UNO",
          "ano": 2019,
          "proprietario": "THIAGO",
          "localizacao": "SALVADOR",
          "familia": 2,
          "status": "ativo",
          "origem_planilha": 1
        }
      ],
      "metrics": {
        "totalLinhas": 6,
        "totalVeiculos": 6,
        "porFamilia": {
          "2": 6
        },
        "porLocalizacao": {
          "SALVADOR": 6
        },
        "processadoEm": "2025-09-25"
      }
    }
  ];

  try {
    // 1. Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    console.log('✅ Usuário autenticado:', user.email);

    // 2. Testar a função get_user_empresa_id
    const { data: empresaId, error: empresaError } = await supabase
      .rpc('get_user_empresa_id');

    if (empresaError) {
      console.error('❌ Erro ao obter empresa do usuário:', empresaError);
      return { success: false, error: empresaError.message };
    }

    console.log('✅ Empresa do usuário criada/obtida:', empresaId);

    // 3. Verificar se a empresa foi criada corretamente
    const { data: empresa, error: empresaQueryError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('id', empresaId)
      .single();

    if (empresaQueryError || !empresa) {
      console.error('❌ Erro ao buscar empresa:', empresaQueryError);
      return { success: false, error: 'Empresa não encontrada após criação' };
    }

    console.log('✅ Empresa confirmada:', empresa.nome);

    // 4. Processar apenas os primeiros 2 veículos como teste
    const veiculosParaTeste = simulatedN8NData[0].veiculos.slice(0, 2);
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < veiculosParaTeste.length; i++) {
      const veiculo = veiculosParaTeste[i];
      console.log(`\n[${i + 1}/${veiculosParaTeste.length}] 🔄 Processando veículo teste:`, veiculo.placa);

      try {
        const veiculoData = {
          empresa_id: empresaId,
          placa: veiculo.placa,
          marca: veiculo.marca || 'FIAT',
          modelo: veiculo.modelo || 'UNO',
          ano_modelo: veiculo.ano ? Number(veiculo.ano) : null,
          chassi: veiculo.chassi || null,
          categoria: 'passeio', // Mapear familia: 2 para passeio
          localizacao: veiculo.localizacao || null,
          status_seguro: veiculo.status === 'ativo' ? 'segurado' : 'sem_seguro',
          status_veiculo: veiculo.status || 'ativo',
          proprietario_tipo: 'pf',
          proprietario_nome: veiculo.proprietario || user.user_metadata?.full_name || 'Teste',
          origem_planilha: 'TESTE_N8N',
          observacoes: `Teste de inserção - Família: ${veiculo.familia}`,
        };

        console.log('📋 Dados do veículo para inserir:', veiculoData);

        // Inserir veículo
        const { data: veiculoInserido, error: veiculoError } = await supabase
          .from('frota_veiculos')
          .insert([veiculoData])
          .select('id, placa')
          .single();

        if (veiculoError) {
          console.error('❌ Erro ao inserir veículo:', veiculoError);
          erros++;
          continue;
        }

        console.log('✅ Veículo inserido com sucesso:', veiculoInserido.placa, '- ID:', veiculoInserido.id);
        sucessos++;

      } catch (err) {
        console.error(`❌ Erro geral ao processar veículo ${i + 1}:`, err);
        erros++;
      }
    }

    console.log(`\n🎉 RESULTADO DO TESTE:`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    
    if (sucessos > 0) {
      // Disparar evento para atualizar o dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      console.log('📡 Evento frota-data-updated disparado');
    }

    return { 
      success: sucessos > 0, 
      sucessos, 
      erros, 
      empresaId, 
      empresaNome: empresa.nome 
    };

  } catch (error: any) {
    console.error('💥 Erro geral no teste:', error);
    return { success: false, error: error.message };
  }
};

// Função para limpar dados de teste
export const limparDadosTeste = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Obter empresa do usuário
    const { data: empresaId } = await supabase.rpc('get_user_empresa_id');
    
    // Deletar veículos de teste
    const { error } = await supabase
      .from('frota_veiculos')
      .delete()
      .eq('empresa_id', empresaId)
      .in('placa', ['A1A1A1A1', 'A1A1A1A2']);

    if (error) {
      console.error('❌ Erro ao limpar dados de teste:', error);
      return { success: false, error: error.message };
    }

    console.log('🗑️ Dados de teste removidos com sucesso');
    
    // Disparar evento para atualizar o dashboard
    window.dispatchEvent(new CustomEvent('frota-data-updated'));
    
    return { success: true };

  } catch (error: any) {
    console.error('💥 Erro ao limpar dados de teste:', error);
    return { success: false, error: error.message };
  }
};