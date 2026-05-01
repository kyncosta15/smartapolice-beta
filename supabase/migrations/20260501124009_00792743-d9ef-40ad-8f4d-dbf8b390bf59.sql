-- 1. Premium control fields
ALTER TABLE public.consultoria_config
  ADD COLUMN IF NOT EXISTS premium_ativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_ativado_em timestamptz,
  ADD COLUMN IF NOT EXISTS premium_expira_em timestamptz,
  ADD COLUMN IF NOT EXISTS premium_observacao text,
  ADD COLUMN IF NOT EXISTS premium_ativado_por uuid;

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.is_consultoria_premium_active(_empresa_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultoria_config c
    WHERE c.empresa_id = _empresa_id
      AND c.premium_ativo = true
      AND (c.premium_expira_em IS NULL OR c.premium_expira_em > now())
  );
$$;

-- 3. consultoria_casos
DROP POLICY IF EXISTS "consultoria_casos_select" ON public.consultoria_casos;
DROP POLICY IF EXISTS "consultoria_casos_insert" ON public.consultoria_casos;
DROP POLICY IF EXISTS "consultoria_casos_update" ON public.consultoria_casos;
DROP POLICY IF EXISTS "consultoria_casos_delete" ON public.consultoria_casos;

CREATE POLICY "consultoria_casos_select" ON public.consultoria_casos FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_casos_insert" ON public.consultoria_casos FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_casos_update" ON public.consultoria_casos FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_casos_delete" ON public.consultoria_casos FOR DELETE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));

-- 4. consultoria_documentos (uses empresa_id directly)
DROP POLICY IF EXISTS "consultoria_documentos_select" ON public.consultoria_documentos;
DROP POLICY IF EXISTS "consultoria_documentos_insert" ON public.consultoria_documentos;
DROP POLICY IF EXISTS "consultoria_documentos_update" ON public.consultoria_documentos;
DROP POLICY IF EXISTS "consultoria_documentos_delete" ON public.consultoria_documentos;

CREATE POLICY "consultoria_documentos_select" ON public.consultoria_documentos FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_documentos_insert" ON public.consultoria_documentos FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_documentos_update" ON public.consultoria_documentos FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_documentos_delete" ON public.consultoria_documentos FOR DELETE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));

-- 5. consultoria_pareceres (uses empresa_id directly)
DROP POLICY IF EXISTS "consultoria_pareceres_select" ON public.consultoria_pareceres;
DROP POLICY IF EXISTS "consultoria_pareceres_insert" ON public.consultoria_pareceres;
DROP POLICY IF EXISTS "consultoria_pareceres_update" ON public.consultoria_pareceres;
DROP POLICY IF EXISTS "consultoria_pareceres_delete" ON public.consultoria_pareceres;

CREATE POLICY "consultoria_pareceres_select" ON public.consultoria_pareceres FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_pareceres_insert" ON public.consultoria_pareceres FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_pareceres_update" ON public.consultoria_pareceres FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_pareceres_delete" ON public.consultoria_pareceres FOR DELETE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));

-- 6. consultoria_lacunas (uses empresa_id directly)
DROP POLICY IF EXISTS "consultoria_lacunas_select" ON public.consultoria_lacunas;
DROP POLICY IF EXISTS "consultoria_lacunas_insert" ON public.consultoria_lacunas;
DROP POLICY IF EXISTS "consultoria_lacunas_update" ON public.consultoria_lacunas;
DROP POLICY IF EXISTS "consultoria_lacunas_delete" ON public.consultoria_lacunas;

CREATE POLICY "consultoria_lacunas_select" ON public.consultoria_lacunas FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_lacunas_insert" ON public.consultoria_lacunas FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_lacunas_update" ON public.consultoria_lacunas FOR UPDATE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));
CREATE POLICY "consultoria_lacunas_delete" ON public.consultoria_lacunas FOR DELETE
USING (public.has_role(auth.uid(),'admin') OR (public.user_belongs_to_empresa(empresa_id) AND public.is_consultoria_premium_active(empresa_id)));

-- 7. consultoria_config: admin manages, client reads own row
DROP POLICY IF EXISTS "consultoria_config_select" ON public.consultoria_config;
DROP POLICY IF EXISTS "consultoria_config_insert" ON public.consultoria_config;
DROP POLICY IF EXISTS "consultoria_config_update" ON public.consultoria_config;
DROP POLICY IF EXISTS "consultoria_config_delete" ON public.consultoria_config;

CREATE POLICY "consultoria_config_select" ON public.consultoria_config FOR SELECT
USING (public.has_role(auth.uid(),'admin') OR public.user_belongs_to_empresa(empresa_id));
CREATE POLICY "consultoria_config_insert" ON public.consultoria_config FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "consultoria_config_update" ON public.consultoria_config FOR UPDATE
USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "consultoria_config_delete" ON public.consultoria_config FOR DELETE
USING (public.has_role(auth.uid(),'admin'));