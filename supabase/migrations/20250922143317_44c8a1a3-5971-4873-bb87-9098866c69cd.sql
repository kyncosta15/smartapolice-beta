-- Criar bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars', 
  'profile-avatars', 
  true,
  5242880, -- 5MB limite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Criar políticas de segurança para o bucket de avatares
CREATE POLICY "Users can view all profile avatars"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Users can upload their own profile avatar"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile avatar"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile avatar"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Adicionar coluna avatar_url na tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;