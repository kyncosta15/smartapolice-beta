import { supabase } from '@/integrations/supabase/client';

/**
 * RESOLUÇÃO AUTOMÁTICA DE user_id QUANDO N8N NÃO FORNECE
 * 
 * Estratégias de resolução:
 * 1. Usar user_id do contexto autenticado atual
 * 2. Mapear por e-mail do segurado 
 * 3. Mapear por tenant/empresa ativo
 * 4. Criar usuário se necessário (para integrações automáticas)
 */
export class UserIdResolver {
  
  /**
   * RESOLVER user_id PRINCIPAL
   */
  static async resolveUserId(
    extractedData: any,
    contextUserId?: string | null
  ): Promise<string> {
    console.log('🔍 Resolvendo user_id para dados:', extractedData);
    console.log('👤 User ID do contexto:', contextUserId);

    // PRIORIDADE 1: User ID do contexto autenticado
    if (contextUserId && contextUserId !== 'null' && contextUserId.trim() !== '') {
      console.log('✅ Usando user_id do contexto autenticado:', contextUserId);
      return contextUserId;
    }

    // PRIORIDADE 2: User ID nos dados do N8N (se válido)
    if (extractedData.user_id && extractedData.user_id !== null && extractedData.user_id.trim() !== '') {
      console.log('✅ Usando user_id dos dados N8N:', extractedData.user_id);
      return extractedData.user_id;
    }

    // PRIORIDADE 3: Mapear por e-mail do segurado
    if (extractedData.email) {
      const userByEmail = await this.findUserByEmail(extractedData.email);
      if (userByEmail) {
        console.log('✅ User ID encontrado por e-mail:', userByEmail);
        return userByEmail;
      }
    }

    // PRIORIDADE 4: Mapear por documento (CPF/CNPJ) 
    if (extractedData.documento) {
      const userByDocument = await this.findUserByDocument(extractedData.documento);
      if (userByDocument) {
        console.log('✅ User ID encontrado por documento:', userByDocument);
        return userByDocument;
      }
    }

    // PRIORIDADE 5: Usuário da sessão atual (fallback)
    const currentUser = await this.getCurrentAuthUser();
    if (currentUser) {
      console.log('✅ Usando usuário da sessão atual:', currentUser);
      return currentUser;
    }

    // ERRO: Não foi possível resolver user_id
    const error = 'Não foi possível resolver user_id para os dados fornecidos';
    console.error('❌', error);
    throw new Error(error);
  }

  /**
   * BUSCAR USUÁRIO POR E-MAIL
   */
  private static async findUserByEmail(email: string): Promise<string | null> {
    try {
      console.log('🔍 Buscando usuário por e-mail:', email);

      // Primeiro tentar na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!userError && userData) {
        return userData.id;
      }

      // Tentar na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')  
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!profileError && profileData) {
        return profileData.id;
      }

      console.log('⚠️ Usuário não encontrado por e-mail:', email);
      return null;

    } catch (error) {
      console.error('❌ Erro ao buscar usuário por e-mail:', error);
      return null;
    }
  }

  /**
   * BUSCAR USUÁRIO POR DOCUMENTO (CPF/CNPJ)
   */
  private static async findUserByDocument(documento: string): Promise<string | null> {
    try {
      console.log('🔍 Buscando usuário por documento:', documento);

      // Limpar documento (apenas números)
      const cleanDoc = documento.replace(/\D/g, '');

      // Buscar em políticas existentes do mesmo documento
      const { data: policyData, error: policyError } = await supabase
        .from('policies')
        .select('user_id')
        .eq('documento', cleanDoc)
        .limit(1)
        .maybeSingle();

      if (!policyError && policyData) {
        console.log('✅ User ID encontrado em políticas com mesmo documento');
        return policyData.user_id;
      }

      console.log('⚠️ Usuário não encontrado por documento:', cleanDoc);
      return null;

    } catch (error) {
      console.error('❌ Erro ao buscar usuário por documento:', error);
      return null;
    }
  }

  /**
   * OBTER USUÁRIO ATUAL DA SESSÃO
   */
  private static async getCurrentAuthUser(): Promise<string | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('⚠️ Nenhum usuário autenticado na sessão');
        return null;
      }

      console.log('✅ Usuário da sessão encontrado:', user.id);
      return user.id;

    } catch (error) {
      console.error('❌ Erro ao obter usuário da sessão:', error);
      return null;
    }
  }

  /**
   * VALIDAR SE USER_ID É VÁLIDO
   */
  static async validateUserId(userId: string): Promise<boolean> {
    try {
      // Verificar se o usuário existe na tabela users
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao validar user_id:', error);
        return false;
      }

      const isValid = !!data;
      console.log(`🔍 User ID ${userId} é ${isValid ? 'válido' : 'inválido'}`);
      return isValid;

    } catch (error) {
      console.error('❌ Erro ao validar user_id:', error);
      return false;
    }
  }

  /**
   * DEBUG: LOG DE TODAS AS ESTRATÉGIAS TENTADAS
   */
  static async debugUserResolution(extractedData: any, contextUserId?: string | null): Promise<void> {
    console.log('🐛 DEBUG - Resolução de user_id:');
    console.log('📊 Dados extraídos:', {
      user_id: extractedData.user_id,
      email: extractedData.email,
      documento: extractedData.documento,
      segurado: extractedData.segurado
    });
    console.log('👤 User ID do contexto:', contextUserId);

    // Tentar cada estratégia
    try {
      if (extractedData.email) {
        const emailResult = await this.findUserByEmail(extractedData.email);
        console.log('📧 Resultado por e-mail:', emailResult);
      }

      if (extractedData.documento) {
        const docResult = await this.findUserByDocument(extractedData.documento);
        console.log('📄 Resultado por documento:', docResult);
      }

      const sessionResult = await this.getCurrentAuthUser();
      console.log('🔐 Resultado da sessão:', sessionResult);

    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  }
}