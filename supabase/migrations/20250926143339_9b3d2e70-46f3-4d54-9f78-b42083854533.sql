-- Fix RLS policies for proper file and data access control per account

-- 1. Drop all existing frota_documentos policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Clientes podem ver documentos da sua empresa" ON frota_documentos;
    DROP POLICY IF EXISTS "RH pode gerenciar documentos da sua empresa" ON frota_documentos;
    DROP POLICY IF EXISTS "Users can view documents from their company vehicles" ON frota_documentos;
    DROP POLICY IF EXISTS "Authorized users can manage documents from their company vehicles" ON frota_documentos;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create secure policies for frota_documentos  
CREATE POLICY "Users can view documents from their company vehicles" 
ON frota_documentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id
    AND fv.empresa_id = current_empresa_id()
  )
);

CREATE POLICY "Authorized users can manage documents from their company vehicles"
ON frota_documentos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id
    AND fv.empresa_id = current_empresa_id()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
    )
  )
);

-- 2. Drop all existing dashboard_exports policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own dashboard exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can create their own dashboard exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can update their own dashboard exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can delete their own dashboard exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Admins can view all dashboard exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can view exports from their company" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can create their own exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can update their own exports" ON dashboard_exports;
    DROP POLICY IF EXISTS "Users can delete their own exports" ON dashboard_exports;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Create policies that respect company boundaries
CREATE POLICY "Users can view exports from their company"
ON dashboard_exports FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin'])
  )
);

CREATE POLICY "Users can create their own exports"
ON dashboard_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports"
ON dashboard_exports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
ON dashboard_exports FOR DELETE
USING (auth.uid() = user_id);