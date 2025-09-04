-- Atualizar o campo company do usuário beneficios@rcaldas.com.br
UPDATE public.profiles 
SET company = 'RCaldas'
WHERE email = 'beneficios@rcaldas.com.br';