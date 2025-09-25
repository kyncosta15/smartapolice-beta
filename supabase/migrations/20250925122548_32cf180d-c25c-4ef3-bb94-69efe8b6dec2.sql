-- Mover alguns veículos para a empresa "Clientes Individuais" para teste
-- Vamos mover 5 veículos da RCaldas para Clientes Individuais para testar o isolamento

UPDATE public.frota_veiculos 
SET empresa_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE empresa_id = '276bb418-bedd-4c23-9729-2716b55c9a7b'
AND id IN (
  SELECT id FROM public.frota_veiculos 
  WHERE empresa_id = '276bb418-bedd-4c23-9729-2716b55c9a7b'
  LIMIT 5
);

-- Verificar a distribuição após a mudança
SELECT 
  e.nome as empresa,
  COUNT(fv.id) as total_veiculos
FROM public.empresas e
LEFT JOIN public.frota_veiculos fv ON e.id = fv.empresa_id
GROUP BY e.id, e.nome
ORDER BY e.nome;