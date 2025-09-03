-- Corrigir foreign key entre employees e empresas
ALTER TABLE employees 
ADD CONSTRAINT employees_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES empresas(id)
ON DELETE SET NULL;

-- Inserir dados do usuário com password_hash 
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
  'rh',
  'active',
  'dummy_hash_placeholder'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Garantir que a empresa RCaldas existe
INSERT INTO empresas (
  nome,
  cnpj,
  contato_rh_nome,
  contato_rh_email
) VALUES (
  'RCaldas',
  '12.345.678/0001-90',
  'Matheus Roxo',
  'matheus.roxo@rcaldas.com.br'
) ON CONFLICT (nome) DO NOTHING;