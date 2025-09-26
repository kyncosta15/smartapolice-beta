import { SupabaseClient } from '@supabase/supabase-js';

export async function ensureProfileAndCompany(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  // Tenta achar profile
  let { data: profile } = await supabase
    .from("user_profiles")
    .select("id, default_empresa_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.default_empresa_id) {
    // Verifica se já existe membership
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("empresa_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let empresaId = membership?.empresa_id;

    if (!empresaId) {
      // Cria empresa para o usuário
      const empresaName = user.user_metadata?.company || `Cliente - ${user.email}`;
      
      const { data: empresa, error: e1 } = await supabase
        .from("empresas")
        .insert({ 
          nome: empresaName,
          cnpj: user.email?.replace('@', '').replace(/\./g, ''),
          slug: empresaName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        })
        .select("id")
        .single();
      
      if (e1) throw e1;
      empresaId = empresa.id;

      // Cria membership
      const { error: e2 } = await supabase
        .from("user_memberships")
        .insert({
          user_id: user.id,
          empresa_id: empresaId,
          role: 'owner',
          status: 'active'
        });
      
      if (e2) throw e2;
    }

    // Cria ou atualiza profile
    if (!profile) {
      const { error: e3 } = await supabase
        .from("user_profiles")
        .insert({
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email,
          default_empresa_id: empresaId
        });
      if (e3) throw e3;
    } else {
      const { error: e4 } = await supabase
        .from("user_profiles")
        .update({ default_empresa_id: empresaId })
        .eq("id", user.id);
      if (e4) throw e4;
    }

    profile = { id: user.id, default_empresa_id: empresaId };
  }

  return { user, empresa_id: profile.default_empresa_id };
}