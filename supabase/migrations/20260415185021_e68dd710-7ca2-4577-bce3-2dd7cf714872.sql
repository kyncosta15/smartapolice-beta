
-- Atualizar email na tabela public.users
UPDATE public.users 
SET email = 'ceo@grupofallcon.com.br', updated_at = now()
WHERE id = '6ba71407-9dbd-45a6-8791-efc12c35468a';

-- Atualizar email na tabela auth.users
UPDATE auth.users 
SET email = 'ceo@grupofallcon.com.br', updated_at = now()
WHERE id = '6ba71407-9dbd-45a6-8791-efc12c35468a';
