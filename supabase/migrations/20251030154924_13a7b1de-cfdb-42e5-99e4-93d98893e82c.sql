-- Adicionar campo renovada à tabela policies
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS renovada BOOLEAN DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN policies.renovada IS 'Indica se a apólice foi renovada (true) ou não renovada (false)';