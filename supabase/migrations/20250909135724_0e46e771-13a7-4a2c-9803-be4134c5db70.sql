-- 1.1. Add flat columns for safe UI rendering
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS seguradora_empresa   text,
  ADD COLUMN IF NOT EXISTS seguradora_entidade  text,
  ADD COLUMN IF NOT EXISTS tipo_categoria       text,
  ADD COLUMN IF NOT EXISTS tipo_cobertura       text,
  ADD COLUMN IF NOT EXISTS valor_mensal_num     numeric;

-- 1.2. Backfill from JSONB columns (if seguradora/tipo are JSONB)
UPDATE policies
SET
  seguradora_empresa  = COALESCE(seguradora_empresa,  seguradora->>'empresa'),
  seguradora_entidade = COALESCE(seguradora_entidade, seguradora->>'entidade'),
  tipo_categoria      = COALESCE(tipo_categoria,      tipo->>'categoria'),
  tipo_cobertura      = COALESCE(tipo_cobertura,      tipo->>'cobertura')
WHERE seguradora IS NOT NULL OR tipo IS NOT NULL;

-- 1.3. Backfill from string-JSON (if seguradora/tipo are TEXT containing JSON)
UPDATE policies
SET
  seguradora_empresa  = COALESCE(seguradora_empresa,  (seguradora::jsonb->>'empresa')),
  seguradora_entidade = COALESCE(seguradora_entidade, (seguradora::jsonb->>'entidade'))
WHERE seguradora IS NOT NULL AND seguradora ~ '^{';

UPDATE policies
SET
  tipo_categoria = COALESCE(tipo_categoria, (tipo::jsonb->>'categoria')),
  tipo_cobertura = COALESCE(tipo_cobertura, (tipo::jsonb->>'cobertura'))
WHERE tipo IS NOT NULL AND tipo ~ '^{';

-- 1.4. Normalize monthly value
UPDATE policies
SET valor_mensal_num = COALESCE(
  valor_mensal_num,
  CASE 
    WHEN valor_parcela IS NOT NULL THEN valor_parcela
    WHEN custo_mensal IS NOT NULL THEN custo_mensal
    ELSE 0
  END
);

-- 1.5. Create safe UI view
CREATE OR REPLACE VIEW policies_ui AS
SELECT
  id,
  user_id,
  numero_apolice as policy_number,
  segurado as name,
  COALESCE(seguradora_empresa,
           CASE
             WHEN seguradora IS NOT NULL AND seguradora ~ '^{' THEN (seguradora::jsonb->>'empresa')
             ELSE seguradora::text
           END, 'N/A') AS seguradora_empresa,
  COALESCE(seguradora_entidade,
           CASE
             WHEN seguradora IS NOT NULL AND seguradora ~ '^{' THEN (seguradora::jsonb->>'entidade')
           END) AS seguradora_entidade,
  COALESCE(tipo_categoria,
           CASE
             WHEN tipo IS NOT NULL AND tipo ~ '^{' THEN (tipo::jsonb->>'categoria')
             ELSE tipo_seguro
           END, 'N/A') AS tipo_categoria,
  COALESCE(tipo_cobertura,
           CASE
             WHEN tipo IS NOT NULL AND tipo ~ '^{' THEN (tipo::jsonb->>'cobertura')
           END, 'N/A') AS tipo_cobertura,
  COALESCE(valor_mensal_num, valor_parcela, custo_mensal, 0) AS valor_mensal,
  status,
  placa,
  inicio_vigencia as start_date,
  fim_vigencia as end_date,
  expiration_date,
  created_at,
  extraido_em as extraction_timestamp
FROM policies;

-- Apply RLS policies to the view
CREATE POLICY "Users can view their own policies in UI view" ON policies_ui FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all policies in UI view" ON policies_ui FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid())::text = 'administrador'::text
);