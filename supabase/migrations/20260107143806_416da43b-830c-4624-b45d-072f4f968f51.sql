-- Atualizar email do usuário LIMP CITY
UPDATE public.users 
SET email = 'nanciara.vieira@limpcity.com.br',
    updated_at = now()
WHERE id = '40f992cb-96a5-4b9c-b4f9-736566b6b089';

-- Atualizar também na tabela profiles se existir
UPDATE public.profiles 
SET email = 'nanciara.vieira@limpcity.com.br',
    updated_at = now()
WHERE id = '40f992cb-96a5-4b9c-b4f9-736566b6b089';