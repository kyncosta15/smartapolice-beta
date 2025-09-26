-- Corrigir configuração do usuário atual e garantir que novos usuários funcionem (sem coluna status)

-- 1. Inserir o usuário atual na tabela users caso não exista
INSERT INTO public.users (
  id, 
  email, 
  name, 
  password_hash,
  role, 
  company,
  phone,
  classification,
  status,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as name,
  'managed_by_auth' as password_hash,
  COALESCE(raw_user_meta_data->>'role', 'cliente') as role,
  COALESCE(raw_user_meta_data->>'company', '') as company,
  raw_user_meta_data->>'phone' as phone,
  COALESCE(raw_user_meta_data->>'classification', 'Corretora') as classification,
  'active' as status,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar empresas para usuários cliente que não têm
INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
SELECT 
  'Cliente - ' || au.email as nome,
  REPLACE(au.email, '@', '') as cnpj,
  now() as created_at,
  now() as updated_at
FROM auth.users au
JOIN public.users u ON au.id = u.id
WHERE u.role = 'cliente' 
AND NOT EXISTS (
  SELECT 1 FROM public.empresas e 
  WHERE e.nome = 'Cliente - ' || au.email
)
ON CONFLICT DO NOTHING;

-- 3. Criar memberships para usuários que não têm (sem coluna status)
INSERT INTO public.user_memberships (
  user_id,
  empresa_id,
  role,
  created_at
)
SELECT 
  u.id as user_id,
  e.id as empresa_id,
  'owner' as role,
  now() as created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
JOIN public.empresas e ON e.nome = 'Cliente - ' || au.email
WHERE u.role = 'cliente'
AND NOT EXISTS (
  SELECT 1 FROM public.user_memberships um 
  WHERE um.user_id = u.id
)
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- 4. Atualizar user_profiles com default_empresa_id para usuários cliente
UPDATE public.user_profiles up
SET default_empresa_id = e.id
FROM public.users u
JOIN auth.users au ON u.id = au.id  
JOIN public.empresas e ON e.nome = 'Cliente - ' || au.email
WHERE up.id = u.id 
AND u.role = 'cliente' 
AND up.default_empresa_id IS NULL;

-- 5. Garantir que a empresa padrão existe
INSERT INTO public.empresas (
  id,
  nome,
  slug,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Clientes Individuais',
  'clientes-individuais',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;