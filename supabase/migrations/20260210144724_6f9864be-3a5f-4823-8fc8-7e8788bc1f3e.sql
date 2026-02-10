
-- Fix locale to PT-BR for month display
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH active_policies AS (
    SELECT id
    FROM policies
    WHERE user_id = p_user_id
      AND (
        lower(status) IN ('vigente', 'ativa', 'vencendo')
        OR lower(policy_status::text) IN ('active', 'expiring')
      )
  ),
  current_month_installments AS (
    SELECT 
      i.id,
      i.policy_id,
      i.numero_parcela,
      i.valor,
      i.data_vencimento,
      i.status,
      p.numero_apolice,
      p.segurado
    FROM installments i
    JOIN active_policies ap ON ap.id = i.policy_id
    JOIN policies p ON p.id = i.policy_id
    WHERE i.user_id = p_user_id
      AND i.data_vencimento >= date_trunc('month', current_date)::date
      AND i.data_vencimento < (date_trunc('month', current_date) + interval '1 month')::date
  ),
  annual_total AS (
    SELECT COALESCE(SUM(ROUND(i.valor::numeric * 100)::bigint), 0) AS total_cents
    FROM installments i
    JOIN active_policies ap ON ap.id = i.policy_id
    WHERE i.user_id = p_user_id
  ),
  month_label AS (
    SELECT CASE extract(month from current_date)
      WHEN 1 THEN 'Janeiro'
      WHEN 2 THEN 'Fevereiro'
      WHEN 3 THEN 'Março'
      WHEN 4 THEN 'Abril'
      WHEN 5 THEN 'Maio'
      WHEN 6 THEN 'Junho'
      WHEN 7 THEN 'Julho'
      WHEN 8 THEN 'Agosto'
      WHEN 9 THEN 'Setembro'
      WHEN 10 THEN 'Outubro'
      WHEN 11 THEN 'Novembro'
      WHEN 12 THEN 'Dezembro'
    END || ' ' || extract(year from current_date)::text AS label
  )
  SELECT jsonb_build_object(
    'totalMesAtual', COALESCE((SELECT SUM(ROUND(valor::numeric * 100)::bigint) FROM current_month_installments), 0)::float / 100,
    'totalAnualReal', (SELECT total_cents FROM annual_total)::float / 100,
    'mesVigente', (SELECT label FROM month_label),
    'parcelas', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'policy_id', policy_id,
        'numero_parcela', numero_parcela,
        'valor', valor,
        'data_vencimento', data_vencimento,
        'status', status,
        'numero_apolice', numero_apolice,
        'segurado', segurado
      ) ORDER BY data_vencimento)
      FROM current_month_installments
    ), '[]'::jsonb)
  );
$$;
