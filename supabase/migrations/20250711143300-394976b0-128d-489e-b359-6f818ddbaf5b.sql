
-- Adicionar enum para os status de renovação
CREATE TYPE policy_status AS ENUM (
  'vigente',
  'aguardando_emissao', 
  'nao_renovada',
  'pendente_analise'
);

-- Adicionar colunas na tabela policies
ALTER TABLE public.policies 
ADD COLUMN expiration_date DATE,
ADD COLUMN policy_status policy_status DEFAULT 'vigente';

-- Atualizar dados existentes (definir expiration_date baseado em fim_vigencia)
UPDATE public.policies 
SET expiration_date = fim_vigencia 
WHERE fim_vigencia IS NOT NULL;

-- Criar índice para melhor performance nas consultas de vencimento
CREATE INDEX idx_policies_expiration_status ON public.policies(expiration_date, policy_status);
