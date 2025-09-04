-- Fix RLS policies for companies table to include corretora_admin
DROP POLICY IF EXISTS "RH can manage companies" ON companies;

CREATE POLICY "RH and Corretora can manage companies" 
ON companies FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
  )
);

-- Also fix employees table RLS to include corretora_admin
DROP POLICY IF EXISTS "RH pode inserir colaboradores da sua empresa" ON employees;
DROP POLICY IF EXISTS "RH pode atualizar colaboradores da sua empresa" ON employees;

CREATE POLICY "RH and Corretora podem inserir colaboradores da sua empresa" 
ON employees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin']))
    AND e.id = employees.company_id
  )
);

CREATE POLICY "RH and Corretora podem atualizar colaboradores da sua empresa" 
ON employees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin']))
    AND e.id = employees.company_id
  )
);

-- Fix dependents table RLS policies
DROP POLICY IF EXISTS "RH pode inserir dependentes da sua empresa" ON dependents;
DROP POLICY IF EXISTS "RH pode atualizar dependentes da sua empresa" ON dependents;

CREATE POLICY "RH and Corretora podem inserir dependentes da sua empresa" 
ON dependents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees emp
    JOIN users u ON TRUE
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin']))
    AND e.id = emp.company_id 
    AND emp.id = dependents.employee_id
  )
);

CREATE POLICY "RH and Corretora podem atualizar dependentes da sua empresa" 
ON dependents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees emp
    JOIN users u ON TRUE  
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin']))
    AND e.id = emp.company_id 
    AND emp.id = dependents.employee_id
  )
);

-- Fix plans table RLS policy
DROP POLICY IF EXISTS "RH can manage plans" ON plans;

CREATE POLICY "RH and Corretora can manage plans" 
ON plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
  )
);

-- Fix employee_plans table RLS policy
DROP POLICY IF EXISTS "RH can manage employee plans" ON employee_plans;

CREATE POLICY "RH and Corretora can manage employee plans" 
ON employee_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
  )
);