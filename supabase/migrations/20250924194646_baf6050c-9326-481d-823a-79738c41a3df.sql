-- Criar tabela para documentos de solicitações de frota externa
CREATE TABLE IF NOT EXISTS public.fleet_request_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice para melhor performance
CREATE INDEX idx_fleet_request_documents_request_id ON public.fleet_request_documents(request_id);

-- Políticas RLS para a tabela
ALTER TABLE public.fleet_request_documents ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (para upload via token público)
CREATE POLICY "Allow public insert for fleet request documents" 
ON public.fleet_request_documents 
FOR INSERT 
WITH CHECK (true);

-- Permitir que usuários da empresa vejam documentos das suas solicitações
CREATE POLICY "Company users can view their fleet request documents" 
ON public.fleet_request_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fleet_change_requests fcr
    JOIN public.users u ON u.company::text = (
      SELECT e.nome FROM public.empresas e WHERE e.id = fcr.empresa_id
    )
    WHERE fcr.id = fleet_request_documents.request_id 
    AND u.id = auth.uid()
    AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin')
  )
);

-- Permitir que RH/Admin da empresa gerencie os documentos
CREATE POLICY "Company admins can manage fleet request documents" 
ON public.fleet_request_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.fleet_change_requests fcr
    JOIN public.users u ON u.company::text = (
      SELECT e.nome FROM public.empresas e WHERE e.id = fcr.empresa_id
    )
    WHERE fcr.id = fleet_request_documents.request_id 
    AND u.id = auth.uid()
    AND u.role IN ('admin', 'administrador', 'corretora_admin')
  )
);