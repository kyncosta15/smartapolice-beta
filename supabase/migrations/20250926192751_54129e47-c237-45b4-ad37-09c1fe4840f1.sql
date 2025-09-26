-- Verificar e corrigir políticas RLS da tabela frota_documentos

-- Primeiro, vamos deletar as políticas existentes se estiverem incorretas
DROP POLICY IF EXISTS "Authorized users can manage documents from their company vehicl" ON frota_documentos;
DROP POLICY IF EXISTS "Users can view documents from their company vehicles" ON frota_documentos;
DROP POLICY IF EXISTS "frota_documentos_all_policy" ON frota_documentos;
DROP POLICY IF EXISTS "frota_documentos_select_policy" ON frota_documentos;

-- Criar políticas RLS mais específicas e funcionais
CREATE POLICY "frota_documentos_select_policy" ON frota_documentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id 
    AND fv.empresa_id = current_empresa_id()
  )
);

CREATE POLICY "frota_documentos_insert_policy" ON frota_documentos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id 
    AND fv.empresa_id = current_empresa_id()
  )
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
  )
);

CREATE POLICY "frota_documentos_update_policy" ON frota_documentos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id 
    AND fv.empresa_id = current_empresa_id()
  )
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
  )
);

CREATE POLICY "frota_documentos_delete_policy" ON frota_documentos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id 
    AND fv.empresa_id = current_empresa_id()
  )
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
  )
);