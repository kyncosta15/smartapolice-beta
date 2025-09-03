-- Adicionar número de protocolo às submissões e criar sequência para tickets
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- Adicionar campos de protocolo na tabela de submissões
ALTER TABLE colaborador_submissoes 
ADD COLUMN IF NOT EXISTS numero_protocolo TEXT,
ADD COLUMN IF NOT EXISTS data_protocolo TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Função para gerar número de protocolo automático
CREATE OR REPLACE FUNCTION generate_protocolo_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_protocolo = 'SB' || LPAD(EXTRACT(year FROM now())::text, 4, '0') || 
                         LPAD(EXTRACT(month FROM now())::text, 2, '0') || 
                         LPAD(nextval('ticket_sequence')::text, 6, '0');
  NEW.data_protocolo = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Trigger para gerar protocolo automaticamente
DROP TRIGGER IF EXISTS generate_protocolo_on_insert ON colaborador_submissoes;
CREATE TRIGGER generate_protocolo_on_insert
  BEFORE INSERT ON colaborador_submissoes
  FOR EACH ROW
  EXECUTE FUNCTION generate_protocolo_number();

-- Simplificar campos obrigatórios do link (apenas nome e CPF)
COMMENT ON COLUMN colaborador_links.campos_solicitados IS 'Agora apenas nome e CPF são obrigatórios';