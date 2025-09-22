-- Atualizar políticas RLS para permitir que clientes vejam veículos da sua empresa

-- Política para SELECT
DROP POLICY IF EXISTS "RH pode ver veículos da sua empresa" ON frota_veiculos;
CREATE POLICY "Usuários autenticados podem ver veículos da sua empresa" 
ON frota_veiculos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente')
  AND e.id = frota_veiculos.empresa_id
));

-- Política para UPDATE
DROP POLICY IF EXISTS "RH pode atualizar veículos da sua empresa" ON frota_veiculos;
CREATE POLICY "Usuários autenticados podem atualizar veículos da sua empresa" 
ON frota_veiculos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente')
  AND e.id = frota_veiculos.empresa_id
));

-- Política para INSERT
DROP POLICY IF EXISTS "RH pode inserir veículos da sua empresa" ON frota_veiculos;
CREATE POLICY "Usuários autenticados podem inserir veículos da sua empresa" 
ON frota_veiculos 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente')
  AND e.id = frota_veiculos.empresa_id
));

-- Política para DELETE
DROP POLICY IF EXISTS "RH pode deletar veículos da sua empresa" ON frota_veiculos;
CREATE POLICY "Usuários autenticados podem deletar veículos da sua empresa" 
ON frota_veiculos 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente')
  AND e.id = frota_veiculos.empresa_id
));