
-- 1) Fix always-true RLS policies (drop duplicates / tighten)

-- fleet_request_documents: stricter _all_policy already exists; drop permissive insert
DROP POLICY IF EXISTS "fleet_request_documents_insert_policy" ON public.fleet_request_documents;

-- users: tighten registration insert to self
DROP POLICY IF EXISTS "Enable insert for registration" ON public.users;
CREATE POLICY "Enable insert for registration"
ON public.users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- policies: tighten with_check for own-update
DROP POLICY IF EXISTS "Users can update their own policies" ON public.policies;
CREATE POLICY "Users can update their own policies"
ON public.policies FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- sinistro_sheet_sync_logs: only service_role / definer functions write; deny client inserts
DROP POLICY IF EXISTS "System can insert sync logs" ON public.sinistro_sheet_sync_logs;

-- 2) Public buckets: drop broad listing SELECT policies (direct file URLs still work for public buckets)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "read_public_avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile avatars" ON storage.objects;

-- 3) Revoke EXECUTE from anon on all SECURITY DEFINER functions in public schema
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, public', r.nspname, r.proname, r.args);
  END LOOP;
END$$;

-- 4) Revoke EXECUTE from authenticated on internal/trigger/debug helpers
--    Keep authenticated EXECUTE on: RPCs called by client + helpers used inside RLS policies
DO $$
DECLARE
  r record;
  keep_funcs text[] := ARRAY[
    -- RPCs called from frontend / edge functions
    'admin_companies_summary','admin_dashboard_metrics','admin_list_approval_requests',
    'approve_insurance_request','reject_insurance_request',
    'debug_user_empresa_complete','delete_policy_completely',
    'fix_categoria_outros_to_sem_seguro','generate_session_token','validate_session_token',
    'get_current_empresa','get_dashboard_kpi_history','get_dashboard_kpis',
    'get_user_empresa_id','limpar_dados_usuario_teste','rh_employee_request',
    -- Helpers used inside RLS policies / other policies' expressions
    'is_admin','is_super_admin','is_company_admin','is_member_of','user_belongs_to_empresa',
    'has_role','get_current_user_role','get_user_role','current_empresa_id',
    'is_consultoria_premium_active','can_access_requests','check_ip_exists'
  ];
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
           pg_catalog.pg_get_function_result(p.oid) AS rettype
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    IF r.rettype = 'trigger' OR NOT (r.proname = ANY(keep_funcs)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated', r.nspname, r.proname, r.args);
    END IF;
  END LOOP;
END$$;
