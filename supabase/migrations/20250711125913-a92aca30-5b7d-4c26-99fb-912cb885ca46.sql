
-- Adicionar campos para rastreamento e identificação única das apólices
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS created_by_extraction BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS extraction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_policies_user_created_by_extraction 
ON public.policies(user_id, created_by_extraction);

-- Atualizar apólices existentes para marcar como extraídas
UPDATE public.policies 
SET created_by_extraction = true 
WHERE created_by_extraction IS NULL;

-- Adicionar trigger para definir automaticamente o timestamp de extração
CREATE OR REPLACE FUNCTION public.set_extraction_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_by_extraction = true AND OLD.created_by_extraction IS DISTINCT FROM true THEN
    NEW.extraction_timestamp = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_policies_extraction_timestamp
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_extraction_timestamp();
