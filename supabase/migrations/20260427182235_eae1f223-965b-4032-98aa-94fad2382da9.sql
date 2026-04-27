-- Função: histórico mensal dos KPIs do dashboard (para sparklines)
-- Retorna 1 linha por mês com (mês, total de apólices ativas no mês, prêmio do mês)
CREATE OR REPLACE FUNCTION public.get_dashboard_kpi_history(_months integer DEFAULT 6)
RETURNS TABLE (
  month_start date,
  total_policies integer,
  monthly_premium numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  n   integer := GREATEST(1, LEAST(COALESCE(_months, 6), 24));
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH months AS (
    -- Gera os primeiros dias dos últimos N meses (mais antigo → mais recente)
    SELECT (date_trunc('month', current_date)::date - (i || ' months')::interval)::date AS m_start
    FROM generate_series(n - 1, 0, -1) AS gs(i)
  ),
  ranges AS (
    SELECT
      m_start,
      (m_start + interval '1 month' - interval '1 day')::date AS m_end
    FROM months
  ),
  user_policies AS (
    SELECT
      p.id,
      p.inicio_vigencia,
      COALESCE(p.expiration_date, p.fim_vigencia) AS fim_efetivo
    FROM public.policies p
    WHERE p.user_id = uid
  ),
  active_per_month AS (
    SELECT
      r.m_start,
      COUNT(up.id)::integer AS total_policies
    FROM ranges r
    LEFT JOIN user_policies up
      ON up.inicio_vigencia IS NOT NULL
     AND up.inicio_vigencia <= r.m_end
     AND (up.fim_efetivo IS NULL OR up.fim_efetivo >= r.m_start)
    GROUP BY r.m_start
  ),
  premium_per_month AS (
    SELECT
      r.m_start,
      COALESCE(SUM(ap.valor), 0)::numeric AS monthly_premium
    FROM ranges r
    LEFT JOIN public.apolice_parcelas ap
      ON ap.vencimento BETWEEN r.m_start AND r.m_end
    LEFT JOIN public.policies p
      ON p.id = ap.apolice_id
     AND p.user_id = uid
    WHERE ap.id IS NULL OR p.id IS NOT NULL
    GROUP BY r.m_start
  )
  SELECT
    a.m_start AS month_start,
    a.total_policies,
    pm.monthly_premium
  FROM active_per_month a
  JOIN premium_per_month pm ON pm.m_start = a.m_start
  ORDER BY a.m_start ASC;
END;
$$;

-- Permite chamar via PostgREST com a sessão do usuário
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpi_history(integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpi_history(integer) FROM anon;
