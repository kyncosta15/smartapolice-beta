-- Criar bucket para arquivos do SmartBenefícios
INSERT INTO storage.buckets (id, name, public) VALUES ('smartbeneficios', 'smartbeneficios', false);

-- Políticas para o bucket smartbeneficios
-- Usuários podem visualizar seus próprios arquivos
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'smartbeneficios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem fazer upload de seus próprios arquivos
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'smartbeneficios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'smartbeneficios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'smartbeneficios' AND auth.uid()::text = (storage.foldername(name))[1]);