-- Garantir que a tabela users tenha REPLICA IDENTITY FULL para realtime completo
ALTER TABLE public.users REPLICA IDENTITY FULL;