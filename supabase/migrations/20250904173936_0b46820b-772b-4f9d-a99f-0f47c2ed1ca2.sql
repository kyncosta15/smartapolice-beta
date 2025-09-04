-- Corrigir os roles dos usuários conforme solicitado
-- beneficios@rcaldas.com.br deve ser RH (gestor_rh)
UPDATE public.users 
SET role = 'gestor_rh' 
WHERE email = 'beneficios@rcaldas.com.br';

-- matheus.roxo@rcaldas.com.br deve ser admin (corretora_admin) 
UPDATE public.users 
SET role = 'corretora_admin' 
WHERE email = 'matheus.roxo@rcaldas.com.br';