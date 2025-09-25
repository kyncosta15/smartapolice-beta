-- Remover todas as políticas existentes do bucket frotas_docs
DROP POLICY IF EXISTS "Users can upload files to frotas_docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in frotas_docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in frotas_docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files in frotas_docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to frotas_docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their frotas_docs files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their frotas_docs files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their frotas_docs files" ON storage.objects;

-- Criar políticas simples e funcionais para o bucket frotas_docs
CREATE POLICY "Allow authenticated users to upload to frotas_docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow authenticated users to view frotas_docs files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow authenticated users to update frotas_docs files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow authenticated users to delete frotas_docs files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'frotas_docs' AND
  auth.uid() IS NOT NULL
);