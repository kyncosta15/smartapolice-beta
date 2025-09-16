-- Verificar e corrigir constraint de categoria
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.frota_veiculos'::regclass 
  AND contype = 'c';