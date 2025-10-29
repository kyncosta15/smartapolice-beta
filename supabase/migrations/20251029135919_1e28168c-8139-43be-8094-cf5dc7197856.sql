-- Criar tabela para armazenar distribuição de seguros
CREATE TABLE IF NOT EXISTS public.seguros_distribution_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_ramo TEXT NOT NULL,
  clientes_vigentes INTEGER NOT NULL DEFAULT 0,
  clientes_ativas INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.seguros_distribution_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios dados de distribuição"
  ON public.seguros_distribution_cache
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios dados de distribuição"
  ON public.seguros_distribution_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios dados de distribuição"
  ON public.seguros_distribution_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios dados de distribuição"
  ON public.seguros_distribution_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_seguros_distribution_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_seguros_distribution_cache_updated_at
  BEFORE UPDATE ON public.seguros_distribution_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seguros_distribution_cache_updated_at();

-- Criar índice para melhor performance
CREATE INDEX idx_seguros_distribution_cache_user_id ON public.seguros_distribution_cache(user_id);
CREATE INDEX idx_seguros_distribution_cache_empresa_id ON public.seguros_distribution_cache(empresa_id);