-- Atualizar políticas RLS para permitir RH ver todas as solicitações da sua empresa
-- incluindo as solicitações públicas (sem company_id)

-- Remover política restritiva anterior
DROP POLICY IF EXISTS "RH pode ver requests da sua empresa" ON requests;

-- Criar nova política mais inclusiva
CREATE POLICY "RH pode ver requests da empresa e solicitações públicas" 
ON requests FOR SELECT
USING (
  -- Permitir se for da mesma empresa OU se for uma solicitação pública
  EXISTS (
    SELECT 1 FROM employees e
    LEFT JOIN empresas emp ON e.company_id = emp.id
    LEFT JOIN users u ON u.company = emp.nome
    WHERE e.id = requests.employee_id 
    AND (
      -- Mesma empresa do usuário logado
      (u.id = auth.uid() AND (u.role = 'rh' OR u.role = 'admin'))
      -- OU solicitação pública (sem company_id)
      OR e.company_id IS NULL
    )
  )
  -- OU se for admin, pode ver tudo
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- Atualizar política de request_items para seguir o mesmo padrão
DROP POLICY IF EXISTS "RH pode ver request_items da sua empresa" ON request_items;

CREATE POLICY "RH pode ver request_items da empresa e públicos"
ON request_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requests r
    JOIN employees e ON r.employee_id = e.id
    LEFT JOIN empresas emp ON e.company_id = emp.id
    LEFT JOIN users u ON u.company = emp.nome
    WHERE r.id = request_items.request_id
    AND (
      -- Mesma empresa do usuário logado
      (u.id = auth.uid() AND (u.role = 'rh' OR u.role = 'admin'))
      -- OU solicitação pública (sem company_id)
      OR e.company_id IS NULL
    )
  )
  -- OU se for admin, pode ver tudo
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- Permitir que RH atualize status das solicitações públicas também
DROP POLICY IF EXISTS "RH pode atualizar requests da sua empresa" ON requests;

CREATE POLICY "RH pode atualizar requests da empresa e públicos"
ON requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM employees e
    LEFT JOIN empresas emp ON e.company_id = emp.id
    LEFT JOIN users u ON u.company = emp.nome
    WHERE e.id = requests.employee_id 
    AND (
      -- Mesma empresa do usuário logado
      (u.id = auth.uid() AND (u.role = 'rh' OR u.role = 'admin'))
      -- OU solicitação pública (sem company_id) - pode gerenciar
      OR (e.company_id IS NULL AND auth.uid() IS NOT NULL)
    )
  )
  -- OU se for admin, pode atualizar tudo
  OR EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);