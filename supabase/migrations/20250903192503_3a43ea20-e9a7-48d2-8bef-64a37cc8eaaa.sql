-- Criar tabela de tickets simples primeiro
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID,
  protocol_code TEXT NOT NULL,
  rh_note TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  external_ref TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_request ON public.tickets(request_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "RH pode gerenciar tickets" ON public.tickets
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('administrador', 'admin', 'rh'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('administrador', 'admin', 'rh'))
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tickets_updated_at();

-- Realtime
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;