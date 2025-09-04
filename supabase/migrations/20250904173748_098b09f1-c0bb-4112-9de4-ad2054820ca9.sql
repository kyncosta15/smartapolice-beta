-- Atualizar o role do usuário para corretora_admin
UPDATE public.users 
SET role = 'corretora_admin' 
WHERE email = 'beneficios@rcaldas.com.br';