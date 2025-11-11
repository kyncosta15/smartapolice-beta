-- Adicionar colunas para marca e nome de embarcação na tabela policies
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS marca character varying,
ADD COLUMN IF NOT EXISTS nome_embarcacao character varying;