-- Criar bucket para documentos de clientes externos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', false);

-- Políticas RLS para o bucket client-documents
-- Permitir que usuários autenticados vejam documentos da sua empresa
CREATE POLICY "Authenticated users can view company client documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'client-documents' 
  AND EXISTS (
    SELECT 1 FROM users u 
    JOIN empresas e ON u.company::text = e.nome 
    WHERE u.id = auth.uid() 
    AND (storage.foldername(name))[1] = e.id::text
  )
);

-- Permitir upload público para solicitações de frota (via token público)
CREATE POLICY "Allow public upload for fleet requests" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'client-documents' 
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Permitir que usuários RH/Admin da empresa vejam e gerenciem os documentos
CREATE POLICY "RH and Admin can manage company client documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'client-documents' 
  AND EXISTS (
    SELECT 1 FROM users u 
    JOIN empresas e ON u.company::text = e.nome 
    WHERE u.id = auth.uid() 
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
    AND (storage.foldername(name))[1] = e.id::text
  )
);