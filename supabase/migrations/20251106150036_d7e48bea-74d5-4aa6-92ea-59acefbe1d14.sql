-- Tabela para armazenar CPFs vinculados (dependentes/subestipulantes)
CREATE TABLE IF NOT EXISTS public.user_cpf_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'dependente', -- 'dependente' ou 'subestipulante'
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cpf)
);

-- Enable RLS
ALTER TABLE public.user_cpf_vinculos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios vínculos
CREATE POLICY "Usuários podem ver seus próprios vínculos de CPF"
  ON public.user_cpf_vinculos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios vínculos
CREATE POLICY "Usuários podem inserir seus próprios vínculos de CPF"
  ON public.user_cpf_vinculos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios vínculos
CREATE POLICY "Usuários podem atualizar seus próprios vínculos de CPF"
  ON public.user_cpf_vinculos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios vínculos
CREATE POLICY "Usuários podem deletar seus próprios vínculos de CPF"
  ON public.user_cpf_vinculos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índice para melhorar performance
CREATE INDEX idx_user_cpf_vinculos_user_id ON public.user_cpf_vinculos(user_id);
CREATE INDEX idx_user_cpf_vinculos_cpf ON public.user_cpf_vinculos(cpf);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_cpf_vinculos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_cpf_vinculos_updated_at
  BEFORE UPDATE ON public.user_cpf_vinculos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_cpf_vinculos_updated_at();