-- Atualizar o role do usuário matheus.roxo para corretora_admin também
UPDATE public.users 
SET role = 'corretora_admin' 
WHERE email = 'matheus.roxo@rcaldas.com.br';