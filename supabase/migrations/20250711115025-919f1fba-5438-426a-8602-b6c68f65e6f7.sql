
-- Atualizar os valores de status existentes para os novos nomes
UPDATE policies 
SET status = 'vigente' 
WHERE status = 'active';

UPDATE policies 
SET status = 'renovada_aguardando' 
WHERE status = 'expiring';

UPDATE policies 
SET status = 'nao_renovada' 
WHERE status = 'expired';

-- Adicionar constraint para garantir apenas valores válidos de status
ALTER TABLE policies 
ADD CONSTRAINT valid_status_values 
CHECK (status IN ('vigente', 'renovada_aguardando', 'nao_renovada', 'under_review'));
