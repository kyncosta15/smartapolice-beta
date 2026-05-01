import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email e password são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Verificar se usuário já existe
    const { data: existingList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    let user = existingList?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (user) {
      // Atualizar senha + confirmar email
      const { data: updated, error: updErr } =
        await admin.auth.admin.updateUserById(user.id, {
          password,
          email_confirm: true,
          user_metadata: {
            ...(user.user_metadata || {}),
            full_name: "RCaldas Master",
            role: "master",
          },
        });
      if (updErr) throw updErr;
      user = updated.user!;
    } else {
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: "RCaldas Master",
            role: "master",
          },
        });
      if (createErr) throw createErr;
      user = created.user!;
    }

    const userId = user.id;

    // 2. Garantir user_profiles com is_admin = true
    await admin
      .from("user_profiles")
      .upsert(
        {
          id: userId,
          display_name: "RCaldas Master",
          is_admin: true,
        },
        { onConflict: "id" },
      );

    // 3. Atribuir roles master + admin em user_roles (idempotente)
    const rolesToInsert = [
      { user_id: userId, role: "master" },
      { user_id: userId, role: "admin" },
    ];

    for (const r of rolesToInsert) {
      const { error: rErr } = await admin
        .from("user_roles")
        .upsert(r, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (rErr) {
        console.error("Erro ao inserir role", r.role, rErr);
      }
    }

    // 4. Atualizar tabela legacy 'users' (role admin) se existir
    await admin
      .from("users")
      .upsert(
        {
          id: userId,
          email,
          name: "RCaldas Master",
          role: "admin",
        },
        { onConflict: "id" },
      );

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        roles: ["master", "admin"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-bootstrap-master error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
