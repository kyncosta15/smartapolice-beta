-- Tabela para armazenar múltiplos documentos por apólice
CREATE TABLE public.policy_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('apolice', 'endosso', 'renovacao')),
  nome_arquivo VARCHAR(255),
  storage_path TEXT NOT NULL,
  tamanho_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents(policy_id);
CREATE INDEX idx_policy_documents_user_id ON public.policy_documents(user_id);

-- Enable RLS
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own policy documents"
ON public.policy_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy documents"
ON public.policy_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy documents"
ON public.policy_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy documents"
ON public.policy_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_policy_documents_updated_at
BEFORE UPDATE ON public.policy_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();