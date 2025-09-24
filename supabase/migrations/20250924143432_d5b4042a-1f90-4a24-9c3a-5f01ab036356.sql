-- Atualizar o role do usuário para permitir acesso aos tickets
UPDATE users 
SET role = 'admin' 
WHERE id = 'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3';