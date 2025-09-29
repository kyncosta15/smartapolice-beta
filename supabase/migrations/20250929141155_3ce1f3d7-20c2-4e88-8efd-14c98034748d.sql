-- Verificar se o bucket frotas_docs existe, se não, criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'frotas_docs') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('frotas_docs', 'frotas_docs', true);
  END IF;
END $$;

-- Criar políticas RLS para o bucket frotas_docs se não existirem
DO $$
BEGIN
  -- Política para visualizar arquivos (SELECT)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Frotas docs are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Frotas docs are viewable by authenticated users" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'frotas_docs' AND auth.uid() IS NOT NULL);
  END IF;

  -- Política para inserir arquivos (INSERT)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Frotas docs can be uploaded by authenticated users'
  ) THEN
    CREATE POLICY "Frotas docs can be uploaded by authenticated users" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'frotas_docs' AND auth.uid() IS NOT NULL);
  END IF;

  -- Política para deletar arquivos (DELETE)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Frotas docs can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Frotas docs can be deleted by authenticated users" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'frotas_docs' AND auth.uid() IS NOT NULL);
  END IF;
END $$;