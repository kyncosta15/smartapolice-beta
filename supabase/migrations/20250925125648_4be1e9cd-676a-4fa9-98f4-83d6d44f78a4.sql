-- Remover a política que está causando o vazamento de dados
DROP POLICY IF EXISTS "service_role_all_access" ON public.frota_veiculos;

-- Verificar se agora só restaram as políticas corretas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'frota_veiculos'
ORDER BY policyname;