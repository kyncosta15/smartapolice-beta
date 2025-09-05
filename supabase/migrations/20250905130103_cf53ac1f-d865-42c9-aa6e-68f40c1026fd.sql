-- Atualizar as políticas RLS para permitir que corretora_admin acesse colaboradores

-- Dropar políticas existentes para colaboradores
DROP POLICY IF EXISTS "RH pode ver colaboradores da sua empresa" ON colaboradores;
DROP POLICY IF EXISTS "RH pode inserir colaboradores da sua empresa" ON colaboradores;
DROP POLICY IF EXISTS "RH pode atualizar colaboradores da sua empresa" ON colaboradores;

-- Criar novas políticas incluindo corretora_admin
CREATE POLICY "RH e Corretora podem ver colaboradores da sua empresa" 
ON colaboradores 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (e.id = colaboradores.empresa_id))
));

CREATE POLICY "RH e Corretora podem inserir colaboradores da sua empresa" 
ON colaboradores 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (e.id = colaboradores.empresa_id))
));

CREATE POLICY "RH e Corretora podem atualizar colaboradores da sua empresa" 
ON colaboradores 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (e.id = colaboradores.empresa_id))
));

-- Atualizar políticas para dependentes também
DROP POLICY IF EXISTS "RH pode ver dependentes da sua empresa" ON dependentes;
DROP POLICY IF EXISTS "RH pode inserir dependentes da sua empresa" ON dependentes;  
DROP POLICY IF EXISTS "RH pode atualizar dependentes da sua empresa" ON dependentes;

CREATE POLICY "RH e Corretora podem ver dependentes da sua empresa" 
ON dependentes 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM ((colaboradores c
    JOIN empresas e ON ((c.empresa_id = e.id)))
    JOIN users u ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (c.id = dependentes.colaborador_id))
));

CREATE POLICY "RH e Corretora podem inserir dependentes da sua empresa" 
ON dependentes 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM ((colaboradores c
    JOIN empresas e ON ((c.empresa_id = e.id)))
    JOIN users u ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (c.id = dependentes.colaborador_id))
));

CREATE POLICY "RH e Corretora podem atualizar dependentes da sua empresa" 
ON dependentes 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM ((colaboradores c
    JOIN empresas e ON ((c.empresa_id = e.id)))
    JOIN users u ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text]))
    AND (c.id = dependentes.colaborador_id))
));