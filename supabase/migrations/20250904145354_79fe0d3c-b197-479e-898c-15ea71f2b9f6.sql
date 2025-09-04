-- Atualizar tabela requests com status expandido
ALTER TABLE IF EXISTS requests 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'recebido',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Criar tabela de trilhas de aprovação (auditoria)
CREATE TABLE IF NOT EXISTS request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('rh', 'adm')),
  decision text NOT NULL CHECK (decision IN ('aprovado', 'recusado')),
  decided_by uuid,
  note text,
  decided_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_req_approvals_req ON request_approvals(request_id);

-- Atualizar tabela tickets existente para o novo fluxo
ALTER TABLE IF EXISTS tickets 
  ADD COLUMN IF NOT EXISTS request_id uuid UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Garantir que tickets tem a estrutura correta
ALTER TABLE tickets 
  ALTER COLUMN protocol_code SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'aberto',
  ADD COLUMN IF NOT EXISTS external_ref text;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;  
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.request_approvals; 
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.tickets;

-- Configurar replica identity
ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER TABLE public.request_approvals REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;

-- Políticas RLS para request_approvals
ALTER TABLE request_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RH e Admin podem ver aprovações" 
  ON request_approvals FOR SELECT 
  USING (can_access_requests());

CREATE POLICY "RH e Admin podem criar aprovações"
  ON request_approvals FOR INSERT
  WITH CHECK (can_access_requests());

-- Atualizar políticas para tickets
DROP POLICY IF EXISTS "RH pode gerenciar request_tickets" ON tickets;
CREATE POLICY "RH e Admin podem gerenciar tickets"
  ON tickets FOR ALL
  USING (can_access_requests())
  WITH CHECK (can_access_requests());