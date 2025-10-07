-- Atualizar role do admin@rcaldas.com.br para admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@rcaldas.com.br';

-- Garantir que todos os outros usuários não admin sejam clientes (exceto os já configurados)
UPDATE public.users
SET role = 'cliente'
WHERE role NOT IN ('admin', 'corretora_admin', 'gestor_rh', 'rh', 'administrador', 'financeiro')
  AND email != 'admin@rcaldas.com.br';