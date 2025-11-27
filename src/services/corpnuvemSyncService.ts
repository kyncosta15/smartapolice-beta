import { supabase } from "@/integrations/supabase/client";
import { getClienteLigacoes, ClienteLigacao } from "./corpnuvem/cliente-ligacoes";

export class CorpNuvemSyncService {
  /**
   * Sincroniza apólices da API CorpNuvem para o banco de dados local
   * Busca pelo CPF/CNPJ do usuário
   */
  static async syncUserPolicies(userDocument: string): Promise<number> {
    try {
      console.log(`🔄 Sincronizando apólices para documento: ${userDocument}`);
      
      // Buscar user_id atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Extrair apenas números do documento
      const cleanDocument = userDocument.replace(/\D/g, '');
      
      // Converter documento para código do cliente (assumindo que é o código)
      // TODO: Implementar busca de cliente por CPF/CNPJ na API
      const clientCode = parseInt(cleanDocument.substring(0, 8)); // Temporário
      
      // Buscar ligações do cliente na API
      const response = await getClienteLigacoes(clientCode);
      
      if (!response.documentos?.documentos) {
        console.log('⚠️ Nenhuma apólice encontrada na API');
        return 0;
      }

      const apolices = response.documentos.documentos;
      console.log(`📋 Encontradas ${apolices.length} apólices na API`);

      // Preparar dados para inserção/atualização
      const records = apolices.map((apolice: ClienteLigacao) => ({
        user_id: user.id,
        codfil: apolice.codfil,
        nosnum: apolice.nosnum,
        tipdoc: apolice.tipdoc,
        seguradora: apolice.seguradora,
        ramo: apolice.ramo,
        cliente_codigo: apolice.cliente_codigo,
        cliente_nome: apolice.cliente,
        cliente_documento: cleanDocument,
        inivig: apolice.inivig,
        fimvig: apolice.fimvig,
        numapo: apolice.numapo,
        numend: apolice.numend,
        sin_situacao: apolice.sin_situacao,
        cancelado: apolice.cancelado,
        renovacao_situacao: apolice.renovacao_situacao,
        nosnum_ren: apolice.nosnum_ren,
        historico_imagem: apolice.historico_imagem,
        dat_inc: apolice.dat_inc,
        dados_completos: JSON.parse(JSON.stringify(apolice)), // Converter para JSON
        ultima_sincronizacao: new Date().toISOString(),
      }));

      // Inserir/Atualizar em lote
      const { error } = await supabase
        .from('apolices_corpnuvem')
        .upsert(records, {
          onConflict: 'nosnum,codfil',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('❌ Erro ao sincronizar apólices:', error);
        throw error;
      }

      console.log(`✅ ${records.length} apólices sincronizadas com sucesso`);
      return records.length;
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Busca apólices sincronizadas do usuário atual
   */
  static async getUserPolicies() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('apolices_corpnuvem')
        .select('*')
        .eq('user_id', user.id)
        .order('fimvig', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar apólices sincronizadas:', error);
      return [];
    }
  }

  /**
   * Verifica se é necessário sincronizar novamente
   * (última sincronização > 24 horas)
   */
  static async needsSync(userDocument: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('apolices_corpnuvem')
        .select('ultima_sincronizacao')
        .eq('user_id', user.id)
        .eq('cliente_documento', userDocument.replace(/\D/g, ''))
        .order('ultima_sincronizacao', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return true;

      const lastSync = new Date(data.ultima_sincronizacao);
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

      return hoursSinceSync > 24;
    } catch (error) {
      return true; // Se erro, assumir que precisa sincronizar
    }
  }
}
