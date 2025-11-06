import { supabase } from '@/integrations/supabase/client';
import { getClientesCorpNuvem } from './corpnuvem/clientes';

/**
 * Sincroniza dados cadastrais do usuário com a API CorpNuvem
 * Busca os dados do cliente usando o documento (CPF/CNPJ) e atualiza o user_profiles
 */
export async function syncProfileFromCorpNuvem(userId: string): Promise<boolean> {
  try {
    console.log('🔄 [Profile Sync] Iniciando sincronização para usuário:', userId);

    // Buscar documento do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('documento')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('❌ [Profile Sync] Erro ao buscar documento:', userError);
      return false;
    }

    if (!userData?.documento) {
      console.log('ℹ️ [Profile Sync] Usuário sem documento cadastrado');
      return false;
    }

    console.log('🔍 [Profile Sync] Buscando dados na API com documento:', userData.documento);

    // Buscar dados na API CorpNuvem
    const clienteData = await getClientesCorpNuvem({ texto: userData.documento });
    
    // Extrair dados do cliente (pode vir como array ou objeto)
    const cliente = Array.isArray(clienteData) ? clienteData[0] : clienteData;

    if (!cliente) {
      console.log('ℹ️ [Profile Sync] Cliente não encontrado na API');
      return false;
    }

    console.log('📦 [Profile Sync] Dados do cliente encontrados:', {
      nome: cliente.nome,
      hasEnderecos: !!cliente.enderecos,
      hasTelefones: !!cliente.telefones
    });

    // Extrair endereço (pegar o primeiro endereço disponível)
    const endereco = cliente.enderecos?.[0] || {};
    const telefone = cliente.telefones?.[0]?.numero || null;

    // Formatar endereço completo
    const enderecoCompleto = endereco.logradouro 
      ? `${endereco.logradouro}${endereco.numero ? ', ' + endereco.numero : ''}${endereco.complemento ? ' - ' + endereco.complemento : ''}`
      : null;

    // Preparar dados para atualização
    const profileData = {
      phone: telefone,
      document: userData.documento,
      birth_date: cliente.data_nascimento || null,
      address: enderecoCompleto,
      city: endereco.cidade || null,
      state: endereco.estado || null,
      zip_code: endereco.cep || null,
      company_name: cliente.nome || null,
    };

    console.log('💾 [Profile Sync] Salvando dados no user_profiles:', profileData);

    // Atualizar user_profiles
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', userId);

    if (updateError) {
      console.error('❌ [Profile Sync] Erro ao atualizar perfil:', updateError);
      return false;
    }

    console.log('✅ [Profile Sync] Sincronização concluída com sucesso!');
    return true;

  } catch (error: any) {
    console.error('❌ [Profile Sync] Erro durante sincronização:', error);
    return false;
  }
}

/**
 * Verifica se os dados cadastrais já estão preenchidos
 */
export async function hasProfileData(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('phone, document, address, city')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ [Profile Sync] Erro ao verificar dados:', error);
      return false;
    }

    // Considera que tem dados se pelo menos 2 campos principais estão preenchidos
    const filledFields = [data?.phone, data?.document, data?.address, data?.city].filter(Boolean).length;
    return filledFields >= 2;
  } catch (error) {
    console.error('❌ [Profile Sync] Erro ao verificar dados:', error);
    return false;
  }
}
