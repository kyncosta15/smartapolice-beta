-- Fix RLS policies for proper file and data access control per account

-- 1. Drop all existing frota_documentos policies
DROP POLICY IF EXISTS "Clientes podem ver documentos da sua empresa" ON frota_documentos;
DROP POLICY IF EXISTS "RH pode gerenciar documentos da sua empresa" ON frota_documentos;
DROP POLICY IF EXISTS "Users can view documents from their company vehicles" ON frota_documentos;
DROP POLICY IF EXISTS "Authorized users can manage documents from their company vehicles" ON frota_documentos;

-- Create new secure policies for frota_documentos
CREATE POLICY "frota_documentos_select_policy" 
ON frota_documentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    WHERE fv.id = frota_documentos.veiculo_id
    AND fv.empresa_id = current_empresa_id()
  )
);

CREATE POLICY "frota_documentos_all_policy"
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
DROP POLICY IF EXISTS "Users can view their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can create their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can update their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can delete their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Admins can view all dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can view exports from their company" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can create their own exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can update their own exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can delete their own exports" ON dashboard_exports;

-- Create new policies for dashboard_exports
CREATE POLICY "dashboard_exports_select_policy"
ON dashboard_exports FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin'])
  )
);

CREATE POLICY "dashboard_exports_insert_policy"
ON dashboard_exports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dashboard_exports_update_policy"
ON dashboard_exports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "dashboard_exports_delete_policy"
ON dashboard_exports FOR DELETE
USING (auth.uid() = user_id);

-- 3. Drop all existing fleet_request_documents policies
DROP POLICY IF EXISTS "Allow public insert for fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Company admins can manage fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Company users can view their fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Public can insert fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Authorized users can manage fleet request documents" ON fleet_request_documents;

-- Create new policies for fleet_request_documents
CREATE POLICY "fleet_request_documents_insert_policy"
ON fleet_request_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "fleet_request_documents_select_policy"
ON fleet_request_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fleet_change_requests fcr
    WHERE fcr.id = fleet_request_documents.request_id
    AND fcr.empresa_id = current_empresa_id()
  )
);

CREATE POLICY "fleet_request_documents_all_policy"
ON fleet_request_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM fleet_change_requests fcr
    WHERE fcr.id = fleet_request_documents.request_id
    AND fcr.empresa_id = current_empresa_id()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin', 'rh', 'gestor_rh'])
    )
  )
);