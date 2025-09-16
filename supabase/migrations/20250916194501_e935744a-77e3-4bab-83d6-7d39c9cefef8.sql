-- Atualizar RLS policies para incluir role 'gestor_rh' nas tabelas de frota

-- Política de SELECT para frota_veiculos
DROP POLICY IF EXISTS "RH pode ver veículos da sua empresa" ON public.frota_veiculos;
CREATE POLICY "RH pode ver veículos da sua empresa" 
ON public.frota_veiculos 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = frota_veiculos.empresa_id))
));

-- Política de INSERT para frota_veiculos
DROP POLICY IF EXISTS "RH pode inserir veículos da sua empresa" ON public.frota_veiculos;
CREATE POLICY "RH pode inserir veículos da sua empresa" 
ON public.frota_veiculos 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = frota_veiculos.empresa_id))
));

-- Política de UPDATE para frota_veiculos
DROP POLICY IF EXISTS "RH pode atualizar veículos da sua empresa" ON public.frota_veiculos;
CREATE POLICY "RH pode atualizar veículos da sua empresa" 
ON public.frota_veiculos 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = frota_veiculos.empresa_id))
));

-- Política de DELETE para frota_veiculos
DROP POLICY IF EXISTS "RH pode deletar veículos da sua empresa" ON public.frota_veiculos;
CREATE POLICY "RH pode deletar veículos da sua empresa" 
ON public.frota_veiculos 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM (users u
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = frota_veiculos.empresa_id))
));

-- Atualizar políticas para frota_responsaveis
DROP POLICY IF EXISTS "RH pode gerenciar responsáveis da sua empresa" ON public.frota_responsaveis;
CREATE POLICY "RH pode gerenciar responsáveis da sua empresa" 
ON public.frota_responsaveis 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM ((frota_veiculos fv
    JOIN users u ON (true))
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = fv.empresa_id) 
    AND (fv.id = frota_responsaveis.veiculo_id))
));

-- Atualizar políticas para frota_pagamentos
DROP POLICY IF EXISTS "RH pode gerenciar pagamentos da sua empresa" ON public.frota_pagamentos;
CREATE POLICY "RH pode gerenciar pagamentos da sua empresa" 
ON public.frota_pagamentos 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM ((frota_veiculos fv
    JOIN users u ON (true))
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = fv.empresa_id) 
    AND (fv.id = frota_pagamentos.veiculo_id))
));

-- Atualizar políticas para frota_documentos
DROP POLICY IF EXISTS "RH pode gerenciar documentos da sua empresa" ON public.frota_documentos;
CREATE POLICY "RH pode gerenciar documentos da sua empresa" 
ON public.frota_documentos 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM ((frota_veiculos fv
    JOIN users u ON (true))
    JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) 
    AND ((u.role)::text = ANY (ARRAY['rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text])) 
    AND (e.id = fv.empresa_id) 
    AND (fv.id = frota_documentos.veiculo_id))
));