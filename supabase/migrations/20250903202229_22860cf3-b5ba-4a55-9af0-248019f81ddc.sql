-- Remover constraint de check da tabela profiles se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Simplesmente criar o registro específico para o usuário que está com problema
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

-- Recriar constraint com os valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY['gestor_rh'::character varying, 'corretora_admin'::character varying, 'rh'::character varying, 'admin'::character varying, 'administrador'::character varying, 'financeiro'::character varying]::text[]));