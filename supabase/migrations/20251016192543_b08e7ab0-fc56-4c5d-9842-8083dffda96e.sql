-- ============================================
-- Security Fix: Address "warn" level findings
-- ============================================

-- 1. FIX: colaborador_submissoes - Restrict public insert/update access
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow public insert on colaborador_submissoes" ON colaborador_submissoes;
DROP POLICY IF EXISTS "Permitir inserção pública de submissões" ON colaborador_submissoes;
DROP POLICY IF EXISTS "Permitir atualizacao para usuarios autenticados" ON colaborador_submissoes;

-- Create token-validated insert policy
CREATE POLICY "Allow validated link submissions" ON colaborador_submissoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM colaborador_links cl
      WHERE cl.id = colaborador_submissoes.link_id
      AND cl.ativo = true
      AND (cl.expira_em IS NULL OR cl.expira_em > now())
    )
  );

-- Restrict updates to authenticated RH/Admin users only
CREATE POLICY "Only RH can update submissions" ON colaborador_submissoes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    )
  );

-- Keep read access for authenticated users
CREATE POLICY "Authenticated users can read submissions" ON colaborador_submissoes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. FIX: session_tokens - Restrict public select access
-- Drop overly permissive public select policy
DROP POLICY IF EXISTS "Allow public token validation" ON session_tokens;

-- Create restrictive select policy
CREATE POLICY "Authenticated users can view own tokens" ON session_tokens
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User can see tokens for their own employee ID
      employee_id IN (
        SELECT id FROM colaboradores WHERE user_id = auth.uid()
      )
      -- Or if they have RH/Admin role
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
      )
    )
  );

-- 3. FIX: function_search_path_mutable - Add search_path to all update functions
-- Update all update_*_updated_at functions to set search_path

CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.touch_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_colaborador_documentos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_company_import_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;