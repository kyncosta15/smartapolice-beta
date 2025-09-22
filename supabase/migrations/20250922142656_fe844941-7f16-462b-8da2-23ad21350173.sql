-- Criar registro do usuário rcaldas na tabela users
INSERT INTO public.users (id, email, name, role, company, status, created_at, updated_at)
VALUES (
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  'rcaldas@rcaldas.com.br', 
  'RCaldas',
  'cliente',
  'RCaldas',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  company = 'RCaldas',
  updated_at = now();