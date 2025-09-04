-- Atualizar o role do usuário para acessar o dashboard administrativo
UPDATE public.users 
SET role = 'administrador' 
WHERE email = 'beneficios@rcaldas.com.br';