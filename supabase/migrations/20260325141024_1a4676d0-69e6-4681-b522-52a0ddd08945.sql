
-- Mover ticket vinculado ao colaborador duplicado para o colaborador correto
UPDATE tickets 
SET segurado_id = 'ddfd6fbb-78ed-48e1-bab1-c13d532ff753' 
WHERE segurado_id = 'a83a862e-529e-40dd-a0d8-08fbecd17ae6';

-- Deletar os 3 registros duplicados de MARIVALDO
DELETE FROM colaboradores 
WHERE id IN (
  'd125eec7-2485-4c16-bbed-7780069c4bd6',
  'a83a862e-529e-40dd-a0d8-08fbecd17ae6',
  'd5042141-3754-4d13-8ad1-51904265a9de'
);
