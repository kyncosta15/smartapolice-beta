-- Corrigir o registro do usuário rcaldas na tabela users
UPDATE public.users 
SET company = 'RCaldas',
    updated_at = now()
WHERE id = 'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3';