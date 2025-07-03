-- Criar bucket para PDFs se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket pdfs
CREATE POLICY "Users can upload their own PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);