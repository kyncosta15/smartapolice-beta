-- Remover veículo de teste inserido durante validação da Edge Function
DELETE FROM public.frota_veiculos
WHERE empresa_id = '0f3a2a8b-896b-47de-b1e9-f0a04d9654cc'
  AND placa = 'ZZZ0Z00';