-- Habilitar realtime para a tabela requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER TABLE public.requests REPLICA IDENTITY FULL;