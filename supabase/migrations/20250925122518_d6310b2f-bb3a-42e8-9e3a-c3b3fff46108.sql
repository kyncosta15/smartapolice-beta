-- Corrigir associação de usuário com empresa
-- 1. Primeiro, vamos garantir que existe uma empresa "Clientes Individuais"
INSERT INTO public.empresas (id, nome, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Clientes Individuais',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Criar membership para o usuário thiago.ncostta98@gmail.com
INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'member',
  now()
FROM public.users u
WHERE u.email = 'thiago.ncostta98@gmail.com'
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- 3. Atualizar a função current_empresa_id para ser mais robusta
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Primeiro: buscar por user_memberships ativo
    (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = auth.uid() LIMIT 1),
    -- Segundo: buscar por company na tabela users
    (SELECT e.id FROM public.empresas e 
     JOIN public.users u ON u.company::text = e.nome 
     WHERE u.id = auth.uid() LIMIT 1),
    -- Terceiro: empresa padrão para clientes individuais  
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- 4. Testar a função
SELECT public.current_empresa_id() as empresa_id_teste;