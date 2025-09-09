-- 1.1. Add flat columns for safe UI rendering
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS seguradora_empresa   text,
  ADD COLUMN IF NOT EXISTS seguradora_entidade  text,
  ADD COLUMN IF NOT EXISTS tipo_categoria       text,
  ADD COLUMN IF NOT EXISTS tipo_cobertura       text,
  ADD COLUMN IF NOT EXISTS valor_mensal_num     numeric;

-- 1.2. Backfill from existing columns (handle potential JSON strings)
UPDATE policies
SET
  seguradora_empresa = COALESCE(
    seguradora_empresa,
    CASE
      WHEN seguradora IS NOT NULL AND seguradora ~ '^{' THEN (seguradora::jsonb->>'empresa')
      ELSE seguradora
    END,
    'N/A'
  ),
  tipo_categoria = COALESCE(
    tipo_categoria,
    CASE
      WHEN tipo_seguro IS NOT NULL AND tipo_seguro ~ '^{' THEN (tipo_seguro::jsonb->>'categoria')
      ELSE tipo_seguro
    END,
    'N/A'
  ),
  tipo_cobertura = COALESCE(
    tipo_cobertura,
    CASE
      WHEN tipo_seguro IS NOT NULL AND tipo_seguro ~ '^{' THEN (tipo_seguro::jsonb->>'cobertura')
      ELSE 'N/A'
    END,
    'N/A'
  )
WHERE seguradora IS NOT NULL OR tipo_seguro IS NOT NULL;

-- 1.3. Normalize monthly value from existing columns
UPDATE policies
SET valor_mensal_num = COALESCE(
  valor_mensal_num,
  valor_parcela,
  custo_mensal,
  0
);

-- 1.4. Create safe UI view that always returns strings
CREATE OR REPLACE VIEW policies_ui AS
SELECT
  id,
  user_id,
  numero_apolice as policy_number,
  segurado as name,
  COALESCE(seguradora_empresa, seguradora, 'N/A') AS seguradora_empresa,
  seguradora_entidade,
  COALESCE(tipo_categoria, tipo_seguro, 'N/A') AS tipo_categoria,
  COALESCE(tipo_cobertura, 'N/A') AS tipo_cobertura,
  COALESCE(valor_mensal_num, valor_parcela, custo_mensal, 0) AS valor_mensal,
  COALESCE(status, 'vigente') as status,
  placa,
  inicio_vigencia as start_date,
  fim_vigencia as end_date,
  expiration_date,
  created_at,
  extraido_em as extraction_timestamp,
  arquivo_url as pdf_path
FROM policies;