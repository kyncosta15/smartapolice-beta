-- Adicionar campos cadastrais à tabela user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS document TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Criar índice para busca por documento
CREATE INDEX IF NOT EXISTS idx_user_profiles_document ON public.user_profiles(document);

-- Comentários descritivos
COMMENT ON COLUMN public.user_profiles.phone IS 'Telefone de contato do usuário';
COMMENT ON COLUMN public.user_profiles.document IS 'CPF ou CNPJ do usuário';
COMMENT ON COLUMN public.user_profiles.birth_date IS 'Data de nascimento do usuário';
COMMENT ON COLUMN public.user_profiles.address IS 'Endereço completo do usuário';
COMMENT ON COLUMN public.user_profiles.city IS 'Cidade do usuário';
COMMENT ON COLUMN public.user_profiles.state IS 'Estado do usuário';
COMMENT ON COLUMN public.user_profiles.zip_code IS 'CEP do endereço do usuário';
COMMENT ON COLUMN public.user_profiles.company_name IS 'Nome da empresa (para pessoa jurídica)';