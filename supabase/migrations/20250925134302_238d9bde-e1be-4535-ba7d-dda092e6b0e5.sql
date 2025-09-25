-- Verificar se os buckets já existem
SELECT id, name, public FROM storage.buckets WHERE name IN ('fleet-documents', 'documentos-frotas');

-- Criar bucket para documentos de frota se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('fleet-documents', 'fleet-documents', false, 52428800, ARRAY[
  'application/pdf',
  'image/jpeg', 
  'image/jpg',
  'image/png',
  'image/webp'
])
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket fleet-documents
CREATE POLICY "Authenticated users can upload fleet documents"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'fleet-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view fleet documents from their company"
ON storage.objects 
FOR SELECT
TO authenticated
USING (
  bucket_id = 'fleet-documents' AND 
  EXISTS (
    SELECT 1 FROM users u 
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (storage.foldername(name))[1] = e.id::text
  )
);

CREATE POLICY "Admins can manage all fleet documents"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'fleet-documents' AND 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'administrador', 'corretora_admin')
  )
);

CREATE POLICY "Company users can delete their fleet documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'fleet-documents' AND 
  EXISTS (
    SELECT 1 FROM users u 
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (storage.foldername(name))[1] = e.id::text
  )
);