
-- Adicionar colunas created_at e updated_at na tabela coberturas
ALTER TABLE public.coberturas 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar índice para melhor performance nas consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_coberturas_policy_created 
ON public.coberturas(policy_id, created_at);

-- Atualizar o trigger existente para incluir updated_at
DROP TRIGGER IF EXISTS coberturas_updated_at ON public.coberturas;

CREATE TRIGGER coberturas_updated_at
  BEFORE UPDATE ON public.coberturas
  FOR EACH ROW
  EXECUTE FUNCTION update_coberturas_updated_at();
