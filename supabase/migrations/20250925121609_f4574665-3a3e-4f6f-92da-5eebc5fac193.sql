-- Migration simplificada para implementar multi-tenant real com RLS
-- 1. Função helper para RLS (simplificada)
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = auth.uid() LIMIT 1),
    (SELECT e.id FROM public.empresas e 
     JOIN public.users u ON u.company::text = e.nome 
     WHERE u.id = auth.uid())
  );
$$;

-- 2. Atualizar RLS para frota_veiculos (removendo policies existentes e criando novas)
DROP POLICY IF EXISTS "service_role_all_access" ON public.frota_veiculos;
DROP POLICY IF EXISTS "veiculos_select" ON public.frota_veiculos;
DROP POLICY IF EXISTS "veiculos_insert" ON public.frota_veiculos;
DROP POLICY IF EXISTS "veiculos_update" ON public.frota_veiculos;
DROP POLICY IF EXISTS "veiculos_delete" ON public.frota_veiculos;

-- Policies multi-tenant para frota_veiculos
CREATE POLICY "frota_veiculos_select_by_empresa"
ON public.frota_veiculos
FOR SELECT
USING (empresa_id = public.current_empresa_id());

CREATE POLICY "frota_veiculos_insert_by_empresa"
ON public.frota_veiculos
FOR INSERT
WITH CHECK (empresa_id = public.current_empresa_id());

CREATE POLICY "frota_veiculos_update_by_empresa"
ON public.frota_veiculos
FOR UPDATE
USING (empresa_id = public.current_empresa_id())
WITH CHECK (empresa_id = public.current_empresa_id());

CREATE POLICY "frota_veiculos_delete_by_empresa"
ON public.frota_veiculos
FOR DELETE
USING (empresa_id = public.current_empresa_id());

-- Service role ainda precisa de acesso total
CREATE POLICY "service_role_all_access"
ON public.frota_veiculos
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_empresa_id ON public.frota_veiculos(empresa_id);

-- 4. Garantir que empresa_id não seja NULL em frota_veiculos (backfill)
UPDATE public.frota_veiculos 
SET empresa_id = (
  SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1
) 
WHERE empresa_id IS NULL;

-- Agora tornar empresa_id NOT NULL
ALTER TABLE public.frota_veiculos 
ALTER COLUMN empresa_id SET NOT NULL;