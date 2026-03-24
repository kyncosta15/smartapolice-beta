-- Adicionar campos do sinistro baseados na planilha
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS numero_sinistro text,
  ADD COLUMN IF NOT EXISTS subsidiaria text,
  ADD COLUMN IF NOT EXISTS beneficiario_nome text,
  ADD COLUMN IF NOT EXISTS prazo date,
  ADD COLUMN IF NOT EXISTS valor_pago numeric,
  ADD COLUMN IF NOT EXISTS status_indenizacao text DEFAULT 'pendente';

-- Comentários para documentação
COMMENT ON COLUMN public.tickets.numero_sinistro IS 'Número do sinistro na seguradora';
COMMENT ON COLUMN public.tickets.subsidiaria IS 'Subsidiária/filial relacionada';
COMMENT ON COLUMN public.tickets.beneficiario_nome IS 'Nome do beneficiário do sinistro';
COMMENT ON COLUMN public.tickets.prazo IS 'Data de prazo para resolução';
COMMENT ON COLUMN public.tickets.valor_pago IS 'Valor efetivamente pago/indenizado';
COMMENT ON COLUMN public.tickets.status_indenizacao IS 'Status da indenização: indenizado, pendente ou negado';