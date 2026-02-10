
-- RPC para calcular KPIs do dashboard em SQL (sem trazer todas as linhas pro client)
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
  )
  SELECT jsonb_build_object(
    'totalMesAtual', COALESCE((SELECT SUM(ROUND(valor::numeric * 100)::bigint) FROM current_month_installments), 0)::float / 100,
    'totalAnualReal', (SELECT total_cents FROM annual_total)::float / 100,
    'mesVigente', to_char(current_date, 'TMMonth YYYY'),
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
