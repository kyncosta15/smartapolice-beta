-- Corrigir role do usuário para valor válido
UPDATE users 
SET role = 'admin'
WHERE id = 'c11f14b0-2004-4949-899b-19dc1a6dfecf';

-- Inserir se não existir com role correto
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
  'admin',
  'active',
  'dummy_hash_placeholder'
) ON CONFLICT (id) DO NOTHING;

-- Adicionar foreign key entre employees e empresas se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_company_id_fkey'
  ) THEN
    ALTER TABLE employees 
    ADD CONSTRAINT employees_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES empresas(id);
  END IF;
END $$;