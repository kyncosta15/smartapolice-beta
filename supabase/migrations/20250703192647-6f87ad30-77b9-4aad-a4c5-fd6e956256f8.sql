-- Inserir o usuário smartapolice@rcaldas.com.br na tabela users
INSERT INTO public.users (id, email, name, password_hash, role, status) 
VALUES (
  'fbc6633b-208a-4ddc-9edd-cfebea46ed5b', 
  'smartapolice@rcaldas.com.br', 
  'SmartApólice', 
  'handled_by_auth',
  'administrador',
  'active'
) ON CONFLICT (id) DO NOTHING;