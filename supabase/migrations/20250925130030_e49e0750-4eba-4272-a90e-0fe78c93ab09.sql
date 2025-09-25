-- Corrigir o vazamento de dados criando política RLS mais restritiva
-- para frota_veiculos que também considera created_by
DROP POLICY IF EXISTS "frota_veiculos_select_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_insert_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_update_by_empresa" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_delete_by_empresa" ON public.frota_veiculos;

-- Novas políticas mais seguras que consideram tanto empresa quanto criador
CREATE POLICY "frota_veiculos_select_secure" ON public.frota_veiculos
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
    -- Usuários veem apenas seus próprios veículos na empresa padrão
    (empresa_id = '00000000-0000-0000-0000-000000000001' AND created_by = auth.uid())
    OR  
    -- Usuários veem veículos de suas empresas específicas (não padrão)
    (empresa_id != '00000000-0000-0000-0000-000000000001' AND empresa_id = current_empresa_id())
  )
);

CREATE POLICY "frota_veiculos_insert_secure" ON public.frota_veiculos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id() AND
  created_by = auth.uid()
);

CREATE POLICY "frota_veiculos_update_secure" ON public.frota_veiculos
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- Admin pode editar tudo
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
    OR
    -- Usuários editam apenas seus próprios veículos
    (created_by = auth.uid())
  )
);

CREATE POLICY "frota_veiculos_delete_secure" ON public.frota_veiculos
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    -- Admin pode deletar tudo
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
    OR
    -- Usuários deletam apenas seus próprios veículos
    (created_by = auth.uid())
  )
);