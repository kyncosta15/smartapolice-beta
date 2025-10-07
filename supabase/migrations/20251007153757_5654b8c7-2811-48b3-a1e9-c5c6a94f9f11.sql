-- ============================================================================
-- Admin Dashboard RPCs e Índices de Performance
-- ============================================================================

-- KPIs globais (todas as empresas) + por seguradora + janelas 30/60d + veículos por empresa
CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
  j jsonb;
BEGIN
  -- Verificar se usuário é admin
  SELECT is_admin INTO _is_admin 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF NOT COALESCE(_is_admin, false) THEN
    RAISE EXCEPTION 'Acesso restrito ao admin';
  END IF;

  -- Construir objeto com todas as métricas
  j := jsonb_build_object(
    'apolices_total', (
      SELECT count(*) 
      FROM public.apolices_beneficios
    ),
    'apolices_por_seguradora', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('seguradora', seguradora, 'total', total) 
        ORDER BY total DESC
      ), '[]'::jsonb)
      FROM (
        SELECT seguradora, count(*) as total
        FROM public.apolices_beneficios
        GROUP BY seguradora
      ) sub
    ),
    'sinistros_total', (
      SELECT count(*) 
      FROM public.tickets 
      WHERE tipo = 'sinistro'
    ),
    'assistencias_total', (
      SELECT count(*) 
      FROM public.tickets 
      WHERE tipo = 'assistencia'
    ),
    'medias_30', jsonb_build_object(
      'sinistros', (
        SELECT COALESCE(avg(daily_count), 0)
        FROM (
          SELECT date_trunc('day', created_at) d, count(*) daily_count
          FROM public.tickets
          WHERE tipo = 'sinistro' AND created_at >= now() - interval '30 days'
          GROUP BY 1
        ) t
      ),
      'assistencias', (
        SELECT COALESCE(avg(daily_count), 0)
        FROM (
          SELECT date_trunc('day', created_at) d, count(*) daily_count
          FROM public.tickets
          WHERE tipo = 'assistencia' AND created_at >= now() - interval '30 days'
          GROUP BY 1
        ) t
      )
    ),
    'medias_60', jsonb_build_object(
      'sinistros', (
        SELECT COALESCE(avg(daily_count), 0)
        FROM (
          SELECT date_trunc('day', created_at) d, count(*) daily_count
          FROM public.tickets
          WHERE tipo = 'sinistro' AND created_at >= now() - interval '60 days'
          GROUP BY 1
        ) t
      ),
      'assistencias', (
        SELECT COALESCE(avg(daily_count), 0)
        FROM (
          SELECT date_trunc('day', created_at) d, count(*) daily_count
          FROM public.tickets
          WHERE tipo = 'assistencia' AND created_at >= now() - interval '60 days'
          GROUP BY 1
        ) t
      )
    ),
    'veiculos_por_empresa', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'empresa_id', empresa_id,
          'empresa_nome', COALESCE(
            (SELECT nome FROM public.empresas e WHERE e.id = v.empresa_id),
            'Sem nome'
          ),
          'total_veiculos', total
        ) ORDER BY total DESC
      ), '[]'::jsonb)
      FROM (
        SELECT empresa_id, count(*) total
        FROM public.frota_veiculos
        GROUP BY empresa_id
      ) v
    )
  );

  RETURN j;
END;
$$;

-- Lista resumida de empresas para side panel
CREATE OR REPLACE FUNCTION public.admin_companies_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
BEGIN
  -- Verificar se usuário é admin
  SELECT is_admin INTO _is_admin 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF NOT COALESCE(_is_admin, false) THEN
    RAISE EXCEPTION 'Acesso restrito ao admin';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'empresa_id', emp.id,
        'empresa_nome', emp.nome,
        'usuarios', (
          SELECT count(*) 
          FROM public.user_profiles p 
          WHERE p.default_empresa_id = emp.id
        ),
        'veiculos', (
          SELECT count(*) 
          FROM public.frota_veiculos v 
          WHERE v.empresa_id = emp.id
        ),
        'apolices', (
          SELECT count(*) 
          FROM public.apolices_beneficios a 
          WHERE a.empresa_id = emp.id
        ),
        'sinistros_abertos', (
          SELECT count(*) 
          FROM public.tickets s 
          WHERE s.empresa_id = emp.id 
            AND s.tipo = 'sinistro'
            AND s.status NOT IN ('finalizado', 'encerrado')
        ),
        'assistencias_abertas', (
          SELECT count(*) 
          FROM public.tickets asst 
          WHERE asst.empresa_id = emp.id 
            AND asst.tipo = 'assistencia'
            AND asst.status NOT IN ('finalizado', 'encerrado')
        ),
        'ultima_atividade', greatest(
          COALESCE((SELECT max(updated_at) FROM public.frota_veiculos WHERE empresa_id = emp.id), 'epoch'::timestamptz),
          COALESCE((SELECT max(updated_at) FROM public.apolices_beneficios WHERE empresa_id = emp.id), 'epoch'::timestamptz),
          COALESCE((SELECT max(updated_at) FROM public.tickets WHERE empresa_id = emp.id), 'epoch'::timestamptz)
        )
      )
    ), '[]'::jsonb)
    FROM public.empresas emp
  );
END;
$$;

-- Lista de solicitações para a página "Solicitações"
CREATE OR REPLACE FUNCTION public.admin_list_approval_requests(p_status text DEFAULT 'pending')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_admin boolean;
BEGIN
  -- Verificar se usuário é admin
  SELECT is_admin INTO _is_admin 
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  IF NOT COALESCE(_is_admin, false) THEN
    RAISE EXCEPTION 'Acesso restrito ao admin';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'empresa_id', r.empresa_id,
        'empresa_nome', (SELECT nome FROM public.empresas e WHERE e.id = r.empresa_id),
        'veiculo_id', r.veiculo_id,
        'placa', (SELECT placa FROM public.frota_veiculos v WHERE v.id = r.veiculo_id),
        'current_status', r.current_status,
        'requested_status', r.requested_status,
        'motivo', r.motivo,
        'status', r.status,
        'requested_by', r.requested_by,
        'created_at', r.created_at,
        'decided_at', r.decided_at,
        'decision_note', r.decision_note
      ) ORDER BY r.created_at DESC
    ), '[]'::jsonb)
    FROM public.insurance_approval_requests r
    WHERE (p_status IS NULL OR r.status = p_status)
  );
END;
$$;

-- Índices de performance
CREATE INDEX IF NOT EXISTS apolices_seguradora_idx ON public.apolices_beneficios(seguradora);
CREATE INDEX IF NOT EXISTS tickets_created_idx ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS tickets_tipo_idx ON public.tickets(tipo);
CREATE INDEX IF NOT EXISTS tickets_empresa_idx ON public.tickets(empresa_id);
CREATE INDEX IF NOT EXISTS frota_veiculos_empresa_idx ON public.frota_veiculos(empresa_id);