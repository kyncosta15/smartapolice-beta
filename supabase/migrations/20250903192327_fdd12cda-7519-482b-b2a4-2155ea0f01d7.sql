-- Criar tabela de tickets (idempotente)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE REFERENCES public.requests(id) ON DELETE CASCADE,
  protocol_code TEXT NOT NULL,
  rh_note TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',   -- aberto|enviado|processando|concluido|recusado|erro
  external_ref TEXT,                       -- id do ticket no backoffice/operadora
  payload JSONB NOT NULL,                  -- snapshot (request + itens + arquivos)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_request ON public.tickets(request_id);

-- Habilitar RLS na tabela tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Política para RH/Admin visualizar tickets
CREATE POLICY "RH pode ver todos os tickets" ON public.tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Política para RH/Admin inserir tickets
CREATE POLICY "RH pode inserir tickets" ON public.tickets
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Política para RH/Admin atualizar tickets
CREATE POLICY "RH pode atualizar tickets" ON public.tickets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
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

-- Habilitar realtime para tickets
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;