-- Adicionar campo segurado_id à tabela tickets para permitir vínculos com segurados/colaboradores
ALTER TABLE public.tickets 
ADD COLUMN segurado_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_tickets_segurado_id ON public.tickets(segurado_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.tickets.segurado_id IS 'ID do segurado/colaborador quando o sinistro não está vinculado a um veículo específico';