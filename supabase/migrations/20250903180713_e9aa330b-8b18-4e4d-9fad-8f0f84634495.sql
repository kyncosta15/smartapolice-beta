-- Tentar com role 'administrador' baseado no contexto original
UPDATE users 
SET role = 'administrador'
WHERE id = 'c11f14b0-2004-4949-899b-19dc1a6dfecf';

INSERT INTO users (
  id,
  email, 
  name,
  company,
  role,
  status,
  password_hash
) VALUES (
  'c11f14b0-2004-4949-899b-19dc1a6dfecf',
  'matheus.roxo@rcaldas.com.br',
  'Matheus Roxo',
  'RCaldas',
  'administrador',
  'active',
  'dummy_hash_placeholder'
) ON CONFLICT (id) DO NOTHING;