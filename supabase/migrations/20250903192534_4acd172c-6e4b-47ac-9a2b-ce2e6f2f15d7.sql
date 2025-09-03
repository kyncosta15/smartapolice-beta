-- Criar tabela de tickets (idempotente)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  protocol_code TEXT NOT NULL,
  rh_note TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',   -- aberto|enviado|processando|concluido|recusado|erro
  external_ref TEXT,                       -- id do ticket no backoffice/operadora
  payload JSONB NOT NULL,                  -- snapshot (request + itens + arquivos)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_request ON tickets(request_id);

-- Habilitar RLS na tabela tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política para RH/Admin visualizar tickets
CREATE POLICY "RH pode ver todos os tickets" ON tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Política para RH/Admin inserir tickets
CREATE POLICY "RH pode inserir tickets" ON tickets
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Política para RH/Admin atualizar tickets
CREATE POLICY "RH pode atualizar tickets" ON tickets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Triggers e realtime
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Habilitar realtime para tickets
ALTER TABLE tickets REPLICA IDENTITY FULL;