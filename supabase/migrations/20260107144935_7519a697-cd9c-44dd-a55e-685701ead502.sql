-- Atualizar email no auth.users (tabela de autenticação)
UPDATE auth.users 
SET email = 'nanciara.vieira@limpcity.com.br',
    email_confirmed_at = now(),
    updated_at = now()
WHERE id = '40f992cb-96a5-4b9c-b4f9-736566b6b089';