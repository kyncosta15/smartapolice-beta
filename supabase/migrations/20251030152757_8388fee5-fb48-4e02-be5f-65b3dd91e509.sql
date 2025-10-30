-- Adicionar colunas nosnum e codfil à tabela policies
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS nosnum INTEGER,
ADD COLUMN IF NOT EXISTS codfil INTEGER;

-- Criar índice para busca rápida por nosnum e codfil
CREATE INDEX IF NOT EXISTS idx_policies_nosnum_codfil ON public.policies(nosnum, codfil);