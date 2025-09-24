-- Corrigir o problema com protocol_code
-- Primeiro, vamos alterar a coluna protocol_code para permitir NULL temporariamente
ALTER TABLE public.tickets ALTER COLUMN protocol_code DROP NOT NULL;

-- Agora inserir os dados de teste
INSERT INTO public.tickets (tipo, status, data_evento, localizacao, empresa_id, created_by, payload) 
SELECT 
    'sinistro' as tipo,
    'aberto' as status,
    '2024-09-20' as data_evento,
    'São Paulo, SP' as localizacao,
    e.id as empresa_id,
    'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3'::uuid as created_by,
    '{"subtipo": "colisao", "valor_estimado": 5000, "descricao": "Colisão na traseira do veículo"}'::jsonb as payload
FROM empresas e 
WHERE e.nome = 'RCaldas'
LIMIT 1;

INSERT INTO public.tickets (tipo, status, data_evento, localizacao, empresa_id, created_by, payload) 
SELECT 
    'assistencia' as tipo,
    'em_analise' as status,
    '2024-09-22' as data_evento,
    'Rio de Janeiro, RJ' as localizacao,
    e.id as empresa_id,
    'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3'::uuid as created_by,
    '{"subtipo": "pane_eletrica", "descricao": "Veículo não liga, suspeita de problema elétrico"}'::jsonb as payload
FROM empresas e 
WHERE e.nome = 'RCaldas'
LIMIT 1;

INSERT INTO public.tickets (tipo, status, data_evento, localizacao, empresa_id, created_by, payload) 
SELECT 
    'sinistro' as tipo,
    'finalizado' as status,
    '2024-09-15' as data_evento,
    'Brasília, DF' as localizacao,
    e.id as empresa_id,
    'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3'::uuid as created_by,
    '{"subtipo": "furto", "valor_estimado": 8000, "descricao": "Furto de peças do veículo"}'::jsonb as payload
FROM empresas e 
WHERE e.nome = 'RCaldas'
LIMIT 1;