-- Criar tabela de tickets sem foreign key primeiro
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

-- Adicionar foreign key constraint
ALTER TABLE public.tickets 
ADD CONSTRAINT fk_tickets_request_id 
FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;

-- Adicionar unique constraint no request_id
ALTER TABLE public.tickets 
ADD CONSTRAINT unique_tickets_request_id 
UNIQUE (request_id);

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