-- Atualizar o role do usuário atual para 'cliente'
UPDATE public.users 
SET role = 'cliente' 
WHERE id = 'bb230901-e06e-4f46-b263-7cdbd90ec9a4' AND role IS NULL;

-- Ajustar políticas RLS para permitir que clientes também façam upload de documentos
DROP POLICY IF EXISTS "frota_documentos_insert_policy" ON frota_documentos;
DROP POLICY IF EXISTS "frota_documentos_update_policy" ON frota_documentos; 
DROP POLICY IF EXISTS "frota_documentos_delete_policy" ON frota_documentos;

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
    AND u.role IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
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
    AND u.role IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
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
    AND u.role IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
  )
);