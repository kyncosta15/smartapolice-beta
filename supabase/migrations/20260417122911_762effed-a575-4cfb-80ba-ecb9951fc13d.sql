-- Tabela leve apenas para verificar se o banco responde a queries
CREATE TABLE IF NOT EXISTS public.health_check (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inserir uma linha sentinela para a query sempre retornar algo
INSERT INTO public.health_check (id)
VALUES (gen_random_uuid());

-- Habilitar RLS
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (anônima e autenticada) — é só um ping de saúde
CREATE POLICY "Public read for health check"
  ON public.health_check
  FOR SELECT
  USING (true);