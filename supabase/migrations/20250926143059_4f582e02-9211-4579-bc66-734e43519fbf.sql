-- Fix RLS policies for proper file and data access control per account

-- 1. Update frota_documentos RLS policies for better security
DROP POLICY IF EXISTS "Clientes podem ver documentos da sua empresa" ON frota_documentos;
DROP POLICY IF EXISTS "RH pode gerenciar documentos da sua empresa" ON frota_documentos;

-- Create more secure policies for frota_documentos
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

-- 2. Update dashboard_exports RLS policies for better account isolation
DROP POLICY IF EXISTS "Users can view their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can create their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can update their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Users can delete their own dashboard exports" ON dashboard_exports;
DROP POLICY IF EXISTS "Admins can view all dashboard exports" ON dashboard_exports;

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

-- 3. Update fleet_request_documents policies with proper account isolation
DROP POLICY IF EXISTS "Allow public insert for fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Company admins can manage fleet request documents" ON fleet_request_documents;
DROP POLICY IF EXISTS "Company users can view their fleet request documents" ON fleet_request_documents;

-- More secure policies for fleet request documents
CREATE POLICY "Public can insert fleet request documents"
ON fleet_request_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Company users can view their fleet request documents"
ON fleet_request_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fleet_change_requests fcr
    WHERE fcr.id = fleet_request_documents.request_id
    AND fcr.empresa_id = current_empresa_id()
  )
);

CREATE POLICY "Authorized users can manage fleet request documents"
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

-- 4. Drop and recreate storage policies for better security
DROP POLICY IF EXISTS "Authenticated users can view frotas docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload frotas docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view fleet documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload fleet documents" ON storage.objects;

-- Create storage policies for frotas_docs bucket
CREATE POLICY "Authenticated users can view frotas docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can upload frotas docs"  
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
);

-- Create storage policies for fleet-documents bucket
CREATE POLICY "Authenticated users can view fleet documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fleet-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can upload fleet documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fleet-documents' 
  AND auth.uid() IS NOT NULL
);