-- Remover constraint de check da tabela profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Primeiro, deletar registros órfãos na tabela profiles (que não têm usuário correspondente)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM public.users);

-- Agora criar o registro para o usuário que está com problema
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  company, 
  is_active
) VALUES (
  'c11f14b0-2004-4949-899b-19dc1a6dfecf',
  'matheus.roxo@rcaldas.com.br',
  'Matheus Roxo',
  'corretora_admin',
  'RCaldas',
  true
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company = EXCLUDED.company,
  is_active = EXCLUDED.is_active;

-- Sincronizar outros usuários que não têm profile
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  company, 
  is_active
)
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.company,
  CASE WHEN u.status = 'active' THEN true ELSE false END
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Recriar constraint com os valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY['gestor_rh'::character varying, 'corretora_admin'::character varying, 'rh'::character varying, 'admin'::character varying, 'administrador'::character varying, 'financeiro'::character varying]::text[]));