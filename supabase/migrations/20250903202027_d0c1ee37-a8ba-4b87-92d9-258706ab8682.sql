-- Remover a constraint de check da coluna role na tabela profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Criar registro na tabela profiles para o usuário que está com problema
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

-- Verificar se existe outros usuários sem profile e criar
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

-- Recriar a constraint com os novos valores permitidos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY['gestor_rh'::character varying, 'corretora_admin'::character varying, 'rh'::character varying, 'admin'::character varying, 'administrador'::character varying, 'financeiro'::character varying]::text[]));