-- Remover todas as políticas existentes primeiro
DROP POLICY IF EXISTS "frota_veiculos_select_secure" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_insert_secure" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_update_secure" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_delete_secure" ON public.frota_veiculos;

-- Criar políticas que isolam usuários individuais na empresa padrão
CREATE POLICY "frota_veiculos_select_isolated" ON public.frota_veiculos
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Admin tem acesso total
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
    OR
    -- Usuários veem apenas seus próprios veículos (sempre)
    created_by = auth.uid()
  )
);

CREATE POLICY "frota_veiculos_insert_isolated" ON public.frota_veiculos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id() AND
  created_by = auth.uid()
);

CREATE POLICY "frota_veiculos_update_isolated" ON public.frota_veiculos
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
    OR
    created_by = auth.uid()
  )
);

CREATE POLICY "frota_veiculos_delete_isolated" ON public.frota_veiculos
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
    OR
    created_by = auth.uid()
  )
);