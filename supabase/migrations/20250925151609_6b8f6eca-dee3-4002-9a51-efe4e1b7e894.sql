-- Criar políticas RLS para o bucket frotas_docs
CREATE POLICY "Users can upload files to frotas_docs bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view files in frotas_docs bucket"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update files in frotas_docs bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete files in frotas_docs bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

-- Verificar se o bucket precisa ser público para downloads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'frotas_docs';