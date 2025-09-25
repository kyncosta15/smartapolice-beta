-- Primeiro, vamos garantir que o usuário tenha membership na empresa correta
INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
VALUES (
  '780fb6e9-235b-476d-9a5d-246c022e80e1'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'member',
  now()
) ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- Corrigir a função current_empresa_id para ser mais robusta
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Primeiro: buscar por user_memberships ativo
    (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = auth.uid() LIMIT 1),
    -- Segundo: buscar por company na tabela users se não houver membership
    (SELECT e.id FROM public.empresas e 
     JOIN public.users u ON u.company::text = e.nome 
     WHERE u.id = auth.uid() LIMIT 1),
    -- Terceiro: empresa padrão para clientes individuais  
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- Verificar se as políticas RLS estão corretas para frota_veiculos
DROP POLICY IF EXISTS "frota_veiculos_select_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_insert_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_update_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_delete_by_empresa" ON public.frota_veiculos;

-- Recriar as políticas RLS de forma mais específica
CREATE POLICY "frota_veiculos_select_by_empresa" ON public.frota_veiculos
FOR SELECT USING (
  empresa_id = public.current_empresa_id()
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "frota_veiculos_insert_by_empresa" ON public.frota_veiculos
FOR INSERT WITH CHECK (
  empresa_id = public.current_empresa_id()
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "frota_veiculos_update_by_empresa" ON public.frota_veiculos
FOR UPDATE USING (
  empresa_id = public.current_empresa_id()
  AND auth.uid() IS NOT NULL
) WITH CHECK (
  empresa_id = public.current_empresa_id()
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "frota_veiculos_delete_by_empresa" ON public.frota_veiculos
FOR DELETE USING (
  empresa_id = public.current_empresa_id()
  AND auth.uid() IS NOT NULL
);

-- Verificar se o RLS está habilitado
ALTER TABLE public.frota_veiculos ENABLE ROW LEVEL SECURITY;