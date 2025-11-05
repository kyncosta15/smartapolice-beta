-- Adicionar coluna client_id para vincular apólices aos clientes
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);