-- Reverter o role do usuário beneficios@rcaldas.com.br para cliente
UPDATE users 
SET role = 'cliente' 
WHERE email = 'beneficios@rcaldas.com.br';