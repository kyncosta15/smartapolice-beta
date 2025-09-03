-- Corrigir relacionamentos e adicionar foreign keys faltantes
ALTER TABLE employees 
ADD CONSTRAINT employees_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES empresas(id);

-- Verificar se usuário existe na tabela users
INSERT INTO users (
  id,
  email, 
  name,
  company,
  role,
  status
) VALUES (
  'c11f14b0-2004-4949-899b-19dc1a6dfecf',
  'matheus.roxo@rcaldas.com.br',
  'Matheus Roxo',
  'RCaldas',
  'rh',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  role = EXCLUDED.role;

-- Verificar se empresa existe
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

-- Criar alguns dados de exemplo
DO $$
DECLARE
  empresa_id uuid;
  emp_id uuid;
BEGIN
  -- Buscar ID da empresa
  SELECT id INTO empresa_id FROM empresas WHERE nome = 'RCaldas' LIMIT 1;
  
  IF empresa_id IS NOT NULL THEN
    -- Criar colaborador exemplo
    INSERT INTO employees (
      company_id,
      cpf,
      full_name,
      email,
      phone,
      status
    ) VALUES (
      empresa_id,
      '123.456.789-00',
      'João Silva',
      'joao.silva@rcaldas.com.br',
      '(11) 99999-9999',
      'ativo'
    ) ON CONFLICT (cpf) DO NOTHING
    RETURNING id INTO emp_id;
    
    -- Criar dependente exemplo se colaborador foi criado
    IF emp_id IS NOT NULL THEN
      INSERT INTO dependents (
        employee_id,
        full_name,
        cpf,
        birth_date,
        relationship
      ) VALUES (
        emp_id,
        'Maria Silva',
        '987.654.321-00',
        '1990-05-15',
        'conjuge'
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;