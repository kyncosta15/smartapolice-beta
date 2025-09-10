-- Remover a constraint existente
ALTER TABLE public.colaborador_submissoes 
DROP CONSTRAINT IF EXISTS colaborador_submissoes_status_check;

-- Adicionar nova constraint com os status corretos
ALTER TABLE public.colaborador_submissoes 
ADD CONSTRAINT colaborador_submissoes_status_check 
CHECK (status IN ('recebida', 'processada', 'aprovada', 'rejeitada', 'concluida'));