-- Remover quaisquer duplicatas existentes baseado em user_id + nosnum + codfil (mantendo a mais recente)
DELETE FROM policies
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, nosnum, codfil 
             ORDER BY created_at DESC
           ) as rn
    FROM policies
    WHERE nosnum IS NOT NULL AND codfil IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- Criar constraint único composto para user_id + nosnum + codfil
-- Isso permite que o upsert funcione corretamente na sincronização do InfoCap
ALTER TABLE policies 
ADD CONSTRAINT policies_user_nosnum_codfil_unique 
UNIQUE (user_id, nosnum, codfil);