-- Adicionar coluna vinculo_cpf na tabela policies para identificar apólices de CPFs vinculados
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS vinculo_cpf TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.policies.vinculo_cpf IS 'CPF/CNPJ vinculado do qual esta apólice foi sincronizada. NULL significa que é do titular principal.';