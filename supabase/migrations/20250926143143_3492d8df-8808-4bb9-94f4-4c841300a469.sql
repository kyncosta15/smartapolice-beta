-- Clean up and fix RLS policies - Drop existing storage policies first

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view frotas docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload frotas docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view fleet documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload fleet documents" ON storage.objects;

-- Create proper storage policies for frotas_docs bucket with company isolation
CREATE POLICY "Company users can view frotas docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente'])
  )
);

CREATE POLICY "Authorized users can upload frotas docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
  )
);

-- Create proper storage policies for fleet-documents bucket with company isolation
CREATE POLICY "Company users can view fleet documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fleet-documents' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente'])
  )
);

CREATE POLICY "Authorized users can upload fleet documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fleet-documents' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
  )
);