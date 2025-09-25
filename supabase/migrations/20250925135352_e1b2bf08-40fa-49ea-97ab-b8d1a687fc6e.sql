-- Adicionar política para permitir uploads públicos na pasta public-requests
CREATE POLICY "Allow public uploads in public-requests folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fleet-documents' AND (storage.foldername(name))[1] = 'public-requests');

-- Permitir leitura pública dos arquivos na pasta public-requests
CREATE POLICY "Allow public read in public-requests folder" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fleet-documents' AND (storage.foldername(name))[1] = 'public-requests');