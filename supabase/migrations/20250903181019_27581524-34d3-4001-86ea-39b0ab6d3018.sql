-- Criar alguns dados de exemplo para testar
DO $$
DECLARE
  empresa_id uuid;
  emp_id uuid;
  dep_id uuid;
BEGIN
  -- Buscar empresa RCaldas
  SELECT id INTO empresa_id FROM empresas WHERE nome = 'RCaldas' LIMIT 1;
  
  IF empresa_id IS NOT NULL THEN
    -- Criar colaborador exemplo 1
    INSERT INTO employees (
      company_id,
      cpf,
      full_name,
      email,
      phone,
      status
    ) VALUES (
      empresa_id,
      '12345678900',
      'João Silva',
      'joao.silva@rcaldas.com.br',
      '(11) 99999-9999',
      'ativo'
    ) ON CONFLICT (cpf) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email
    RETURNING id INTO emp_id;
    
    -- Criar dependente para o colaborador
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
        '98765432100',
        '1990-05-15',
        'conjuge'
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- Criar colaborador exemplo 2  
    INSERT INTO employees (
      company_id,
      cpf,
      full_name,
      email,
      phone,
      status
    ) VALUES (
      empresa_id,
      '11122233344',
      'Ana Santos',
      'ana.santos@rcaldas.com.br',
      '(11) 88888-8888',
      'ativo'
    ) ON CONFLICT (cpf) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email
    RETURNING id INTO emp_id;
    
    -- Criar dependente para Ana
    IF emp_id IS NOT NULL THEN
      INSERT INTO dependents (
        employee_id,
        full_name,
        cpf,
        birth_date,
        relationship
      ) VALUES (
        emp_id,
        'Pedro Santos',
        '12312312312',
        '2015-03-20',
        'filho'
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;