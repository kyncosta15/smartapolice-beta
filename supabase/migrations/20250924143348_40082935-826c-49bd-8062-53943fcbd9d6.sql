-- Inserir dados de teste de sinistros e assistências com protocol_code
INSERT INTO public.tickets (
  tipo, 
  status, 
  protocol_code,
  data_evento, 
  localizacao, 
  empresa_id, 
  created_by,
  payload
) VALUES 
(
  'sinistro',
  'aberto',
  'SIN-2024-000001',
  '2024-09-20',
  'São Paulo - SP',
  '276bb418-bedd-4c23-9729-2716b55c9a7b',
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  '{"subtipo": "colisao", "valor_estimado": 5000, "descricao": "Colisão traseira no estacionamento"}'
),
(
  'sinistro',
  'em_analise',
  'SIN-2024-000002',
  '2024-09-18',
  'Rio de Janeiro - RJ',
  '276bb418-bedd-4c23-9729-2716b55c9a7b',
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  '{"subtipo": "roubo_furto", "valor_estimado": 25000, "descricao": "Veículo roubado durante parada em semáforo"}'
),
(
  'assistencia',
  'aberto',
  'ASS-2024-000001',
  '2024-09-22',
  'Belo Horizonte - MG',
  '276bb418-bedd-4c23-9729-2716b55c9a7b',
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  '{"subtipo": "pane_mecanica", "descricao": "Motor superaquecendo, veículo parado na via"}'
),
(
  'assistencia',
  'finalizado',
  'ASS-2024-000002',
  '2024-09-15',
  'Porto Alegre - RS',
  '276bb418-bedd-4c23-9729-2716b55c9a7b',
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  '{"subtipo": "pneu_furado", "descricao": "Troca de pneu realizada com sucesso"}'
);