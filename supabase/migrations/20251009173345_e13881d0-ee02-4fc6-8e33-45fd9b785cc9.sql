-- Remover string incorreta do campo CNPJ dos veículos da ESCAVE ENGENHARIA
UPDATE frota_veiculos
SET proprietario_doc = REPLACE(proprietario_doc, 'rcaldasrcaldascombr', ''),
    updated_at = now()
WHERE empresa_id = (SELECT id FROM empresas WHERE nome ILIKE '%ESCAVE%ENGENHARIA%')
  AND proprietario_doc LIKE '%rcaldasrcaldascombr%';