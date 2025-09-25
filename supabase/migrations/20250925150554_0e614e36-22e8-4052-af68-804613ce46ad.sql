-- Check and create missing storage policies for frotas_docs bucket

-- Policy for INSERT (upload)
INSERT INTO storage.objects (bucket_id, name, owner, metadata) 
SELECT 'frotas_docs', 'test', auth.uid(), '{}' 
WHERE FALSE; -- Just to test RLS

-- Create policies if they don't exist
DO $$
BEGIN
  -- Policy to allow users to upload their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload to frotas_docs'
  ) THEN
    CREATE POLICY "Users can upload to frotas_docs"
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'frotas_docs' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy to allow users to view their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their frotas_docs files'
  ) THEN
    CREATE POLICY "Users can view their frotas_docs files"
    ON storage.objects 
    FOR SELECT 
    USING (
      bucket_id = 'frotas_docs' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy to allow users to update their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their frotas_docs files'
  ) THEN
    CREATE POLICY "Users can update their frotas_docs files"
    ON storage.objects 
    FOR UPDATE 
    USING (
      bucket_id = 'frotas_docs' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Policy to allow users to delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their frotas_docs files'
  ) THEN
    CREATE POLICY "Users can delete their frotas_docs files"
    ON storage.objects 
    FOR DELETE 
    USING (
      bucket_id = 'frotas_docs' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;