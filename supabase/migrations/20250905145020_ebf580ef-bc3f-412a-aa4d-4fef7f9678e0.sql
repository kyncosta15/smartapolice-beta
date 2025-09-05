-- Política para permitir DELETE de colaboradores pela mesma empresa
DROP POLICY IF EXISTS "RH e Corretora podem deletar colaboradores da sua empresa" ON colaboradores;

CREATE POLICY "RH e Corretora podem deletar colaboradores da sua empresa"
ON colaboradores
FOR DELETE
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

-- Política para permitir DELETE de dependentes pela mesma empresa
DROP POLICY IF EXISTS "RH e Corretora podem deletar dependentes da sua empresa" ON dependentes;

CREATE POLICY "RH e Corretora podem deletar dependentes da sua empresa"
ON dependentes
FOR DELETE
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