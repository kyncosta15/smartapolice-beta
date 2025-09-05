-- Atualizar política de INSERT para colaboradores incluindo gestor_rh
DROP POLICY IF EXISTS "RH e Corretora podem inserir colaboradores da sua empresa" ON colaboradores;

CREATE POLICY "RH e Corretora podem inserir colaboradores da sua empresa"
ON colaboradores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND e.id = colaboradores.empresa_id
  )
);

-- Atualizar política de UPDATE para colaboradores incluindo gestor_rh
DROP POLICY IF EXISTS "RH e Corretora podem atualizar colaboradores da sua empresa" ON colaboradores;

CREATE POLICY "RH e Corretora podem atualizar colaboradores da sua empresa"
ON colaboradores
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND e.id = colaboradores.empresa_id
  )
);

-- Atualizar política de SELECT para colaboradores incluindo gestor_rh
DROP POLICY IF EXISTS "RH e Corretora podem ver colaboradores da sua empresa" ON colaboradores;

CREATE POLICY "RH e Corretora podem ver colaboradores da sua empresa"
ON colaboradores
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND e.id = colaboradores.empresa_id
  )
);

-- Verificar e atualizar políticas para dependentes também
DROP POLICY IF EXISTS "RH e Corretora podem inserir dependentes" ON dependentes;

CREATE POLICY "RH e Corretora podem inserir dependentes"
ON dependentes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    JOIN colaboradores c ON c.empresa_id = e.id
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND c.id = dependentes.colaborador_id
  )
);

DROP POLICY IF EXISTS "RH e Corretora podem ver dependentes" ON dependentes;

CREATE POLICY "RH e Corretora podem ver dependentes"
ON dependentes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    JOIN colaboradores c ON c.empresa_id = e.id
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND c.id = dependentes.colaborador_id
  )
);

DROP POLICY IF EXISTS "RH e Corretora podem atualizar dependentes" ON dependentes;

CREATE POLICY "RH e Corretora podem atualizar dependentes"
ON dependentes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM users u
    JOIN empresas e ON u.company = e.nome
    JOIN colaboradores c ON c.empresa_id = e.id
    WHERE u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND c.id = dependentes.colaborador_id
  )
);