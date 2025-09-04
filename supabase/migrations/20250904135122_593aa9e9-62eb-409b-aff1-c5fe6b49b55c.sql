-- Fix RLS policies for employees table
-- Drop existing policies
DROP POLICY IF EXISTS "RH and Corretora podem inserir colaboradores da sua empresa" ON employees;
DROP POLICY IF EXISTS "RH and Corretora podem atualizar colaboradores da sua empresa" ON employees;
DROP POLICY IF EXISTS "Allow RH and Admin to view employees" ON employees;

-- Create new, corrected policies for employees
CREATE POLICY "Corretora and RH can insert employees in their company" ON employees
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND e.id = company_id
  )
);

CREATE POLICY "Corretora and RH can view employees in their company" ON employees
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND e.id = company_id
  )
);

CREATE POLICY "Corretora and RH can update employees in their company" ON employees
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND e.id = company_id
  )
);

-- Also fix dependents policies
DROP POLICY IF EXISTS "RH and Corretora podem inserir dependentes da sua empresa" ON dependents;
DROP POLICY IF EXISTS "RH and Corretora podem atualizar dependentes da sua empresa" ON dependents;

CREATE POLICY "Corretora and RH can insert dependents" ON dependents
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM employees emp
    JOIN users u ON TRUE
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND e.id = emp.company_id
    AND emp.id = employee_id
  )
);

CREATE POLICY "Corretora and RH can update dependents" ON dependents
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM employees emp
    JOIN users u ON TRUE
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND e.id = emp.company_id
    AND emp.id = employee_id
  )
);