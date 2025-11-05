-- Adicionar coluna pdf_url na tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pdf_url TEXT;