
-- Criar tabela para armazenar projeções mensais
CREATE TABLE public.monthly_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  projected_cost NUMERIC NOT NULL DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Habilitar RLS
ALTER TABLE public.monthly_projections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projeções mensais
CREATE POLICY "Users can view their own projections" 
  ON public.monthly_projections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projections" 
  ON public.monthly_projections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projections" 
  ON public.monthly_projections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projections" 
  ON public.monthly_projections 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all projections" 
  ON public.monthly_projections 
  FOR SELECT 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'administrador');

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_monthly_projections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_monthly_projections_updated_at
  BEFORE UPDATE ON public.monthly_projections
  FOR EACH ROW EXECUTE FUNCTION public.update_monthly_projections_updated_at();

-- Habilitar realtime para a tabela
ALTER TABLE public.monthly_projections REPLICA IDENTITY FULL;
