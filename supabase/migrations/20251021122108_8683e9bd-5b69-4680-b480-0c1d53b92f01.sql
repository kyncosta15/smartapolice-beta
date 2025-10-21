-- Criar tabela tickets se não existir
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_code TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('sinistro', 'assistencia')),
  subtipo TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  data_evento DATE,
  valor_estimado NUMERIC,
  localizacao TEXT,
  origem TEXT NOT NULL DEFAULT 'portal' CHECK (origem IN ('portal', 'importacao', 'api')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_id UUID REFERENCES public.frota_veiculos(id) ON DELETE SET NULL,
  apolice_id UUID,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_empresa_id ON public.tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON public.tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_vehicle_id ON public.tickets(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_tickets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_tickets_updated_at_trigger ON public.tickets;
CREATE TRIGGER update_tickets_updated_at_trigger
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tickets_updated_at();

-- Habilitar RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: Usuários podem ver tickets da sua empresa
DROP POLICY IF EXISTS "tickets_select_policy" ON public.tickets;
CREATE POLICY "tickets_select_policy" ON public.tickets
  FOR SELECT
  USING (
    empresa_id = current_empresa_id() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
  );

-- Política de INSERT: Usuários autenticados podem criar tickets da sua empresa
DROP POLICY IF EXISTS "tickets_insert_policy" ON public.tickets;
CREATE POLICY "tickets_insert_policy" ON public.tickets
  FOR INSERT
  WITH CHECK (
    empresa_id = current_empresa_id() AND
    auth.uid() IS NOT NULL
  );

-- Política de UPDATE: Usuários podem atualizar tickets da sua empresa
DROP POLICY IF EXISTS "tickets_update_policy" ON public.tickets;
CREATE POLICY "tickets_update_policy" ON public.tickets
  FOR UPDATE
  USING (
    empresa_id = current_empresa_id() AND
    auth.uid() IS NOT NULL
  );

-- Política de DELETE: Usuários podem deletar tickets da sua empresa
DROP POLICY IF EXISTS "tickets_delete_policy" ON public.tickets;
CREATE POLICY "tickets_delete_policy" ON public.tickets
  FOR DELETE
  USING (
    empresa_id = current_empresa_id() AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'administrador', 'corretora_admin', 'rh', 'gestor_rh', 'cliente')
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.tickets IS 'Tabela para armazenar sinistros e assistências';
COMMENT ON COLUMN public.tickets.tipo IS 'Tipo do ticket: sinistro ou assistencia';
COMMENT ON COLUMN public.tickets.status IS 'Status atual do ticket: aberto, em_analise, em_regulacao, finalizado';
COMMENT ON COLUMN public.tickets.origem IS 'Origem do ticket: portal, importacao ou api';