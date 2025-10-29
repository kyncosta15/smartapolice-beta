-- Adicionar campo documento na tabela users para sincronização InfoCap
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS documento TEXT;

-- Criar índice para busca rápida por documento
CREATE INDEX IF NOT EXISTS idx_users_documento ON public.users(documento);

-- Comentário explicativo
COMMENT ON COLUMN public.users.documento IS 'CPF ou CNPJ do usuário para sincronização com InfoCap (apenas números)';
