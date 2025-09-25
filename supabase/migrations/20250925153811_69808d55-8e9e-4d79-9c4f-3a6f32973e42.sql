-- Adicionar coluna avatar_url à tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;