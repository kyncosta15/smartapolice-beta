ALTER TABLE public.policies DROP CONSTRAINT IF EXISTS valid_status_values;
ALTER TABLE public.policies ADD CONSTRAINT valid_status_values
  CHECK (status::text = ANY (ARRAY[
    'vigente','ativa','vencendo','vencida','aguardando_emissao',
    'nao_renovada','pendente_analise','renovada_aguardando',
    'under_review','desconhecido','renovada'
  ]::text[]));