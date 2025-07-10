
-- Verificar se a tabela coberturas já existe e tem os campos necessários
-- Se não existir, criar a tabela coberturas
CREATE TABLE IF NOT EXISTS public.coberturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  lmi NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela coberturas
ALTER TABLE public.coberturas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para coberturas
CREATE POLICY "Users can view their own policy coverages" 
  ON public.coberturas 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.policies 
      WHERE policies.id = coberturas.policy_id 
      AND policies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert coverages for their own policies" 
  ON public.coberturas 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.policies 
      WHERE policies.id = coberturas.policy_id 
      AND policies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update coverages for their own policies" 
  ON public.coberturas 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.policies 
      WHERE policies.id = coberturas.policy_id 
      AND policies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete coverages for their own policies" 
  ON public.coberturas 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.policies 
      WHERE policies.id = coberturas.policy_id 
      AND policies.user_id = auth.uid()
    )
  );

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_coberturas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER coberturas_updated_at
  BEFORE UPDATE ON public.coberturas
  FOR EACH ROW
  EXECUTE FUNCTION update_coberturas_updated_at();
