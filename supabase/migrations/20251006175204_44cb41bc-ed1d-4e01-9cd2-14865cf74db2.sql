-- =========================================
-- POLÍTICAS RLS PARA STORAGE BUCKET 'pdfs'
-- =========================================

-- 1. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can upload PDFs to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can download their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;

-- 2. Política para UPLOAD (INSERT) - Apenas na pasta do próprio usuário
CREATE POLICY "Users can upload PDFs to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Política para VIEW/DOWNLOAD (SELECT) - Apenas PDFs da pasta do próprio usuário  
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política para UPDATE - Apenas PDFs da pasta do próprio usuário
CREATE POLICY "Users can update their own PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política para DELETE - Apenas PDFs da pasta do próprio usuário
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================
-- COMENTÁRIOS
-- =========================================
-- Estas políticas garantem que:
-- 1. Cada usuário só pode fazer upload na sua própria pasta (userId/arquivo.pdf)
-- 2. Cada usuário só pode ver/baixar seus próprios PDFs
-- 3. Cada usuário só pode atualizar seus próprios PDFs
-- 4. Cada usuário só pode deletar seus próprios PDFs
-- 
-- Estrutura de pastas: bucket_pdfs/user_id/timestamp_filename.pdf