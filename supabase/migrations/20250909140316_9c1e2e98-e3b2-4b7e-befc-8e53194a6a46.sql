-- Enable RLS on the policies_ui view
ALTER VIEW policies_ui SET (security_barrier = true);

-- Apply RLS policies to the view
DROP POLICY IF EXISTS "Users can view their own policies in UI view" ON policies_ui;
DROP POLICY IF EXISTS "Admins can view all policies in UI view" ON policies_ui;

-- Since we can't apply RLS directly on views in the same way as tables,
-- let's recreate the view with security invoker (default behavior)
DROP VIEW IF EXISTS policies_ui;

CREATE VIEW policies_ui 
WITH (security_invoker = true)
AS
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