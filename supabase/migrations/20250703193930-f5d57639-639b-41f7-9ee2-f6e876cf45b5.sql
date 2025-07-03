-- Habilitar realtime para as tabelas policies e users
-- Isso permitirá que o dashboard seja atualizado em tempo real

-- Primeiro, configurar REPLICA IDENTITY FULL para capturar dados completos
ALTER TABLE public.policies REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação realtime
-- Isso permite que os clientes recebam atualizações em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.policies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;