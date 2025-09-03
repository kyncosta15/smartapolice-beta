-- Criar tabela de request_tickets para o sistema de solicitações
CREATE TABLE IF NOT EXISTS public.request_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE,
  protocol_code TEXT NOT NULL,
  rh_note TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',   -- aberto|enviado|processando|concluido|recusado|erro
  external_ref TEXT,                       -- id do ticket no backoffice/operadora
  payload JSONB NOT NULL,                  -- snapshot (request + itens + arquivos)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_request_tickets_request_id ON public.request_tickets(request_id);
CREATE INDEX IF NOT EXISTS idx_request_tickets_status ON public.request_tickets(status);
CREATE INDEX IF NOT EXISTS idx_request_tickets_protocol ON public.request_tickets(protocol_code);

-- RLS
ALTER TABLE public.request_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "RH pode gerenciar request_tickets" ON public.request_tickets
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('administrador', 'admin', 'rh'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('administrador', 'admin', 'rh'))
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_request_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_tickets_updated_at
  BEFORE UPDATE ON public.request_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_request_tickets_updated_at();

-- Realtime
ALTER TABLE public.request_tickets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_tickets;