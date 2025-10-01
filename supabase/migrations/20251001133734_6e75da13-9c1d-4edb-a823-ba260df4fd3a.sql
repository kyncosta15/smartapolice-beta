-- Remover a constraint antiga
ALTER TABLE public.policies DROP CONSTRAINT IF EXISTS valid_status_values;

-- Criar nova constraint com todos os valores de status suportados
ALTER TABLE public.policies ADD CONSTRAINT valid_status_values 
CHECK (status IN (
  'vigente',
  'ativa',
  'vencendo',
  'vencida',
  'aguardando_emissao',
  'nao_renovada',
  'pendente_analise',
  'renovada_aguardando',
  'under_review',
  'desconhecido'
));