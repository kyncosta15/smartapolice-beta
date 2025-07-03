-- Habilitar realtime para a tabela users para sincronização automática
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Adicionar a tabela users à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;