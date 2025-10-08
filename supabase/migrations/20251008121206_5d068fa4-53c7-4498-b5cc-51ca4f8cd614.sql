-- Atualizar função admin_companies_summary para incluir apólices de PDFs
CREATE OR REPLACE FUNCTION public.admin_companies_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          -- Somar apólices de benefícios + apólices de PDFs (auto)
          SELECT (
            COALESCE((SELECT count(*) FROM public.apolices_beneficios ab WHERE ab.empresa_id = emp.id), 0) +
            COALESCE((SELECT count(*) FROM public.policies p 
              JOIN public.users u ON p.user_id = u.id 
              WHERE u.company = emp.nome), 0)
          )
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
$function$;

-- Atualizar função admin_dashboard_metrics para incluir apólices de PDFs
CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      -- Somar apólices de benefícios + apólices de PDFs
      SELECT (
        COALESCE((SELECT count(*) FROM public.apolices_beneficios), 0) +
        COALESCE((SELECT count(*) FROM public.policies), 0)
      )
    ),
    'apolices_por_seguradora', (
      -- Unir seguradoras de ambas as tabelas
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('seguradora', seguradora, 'total', total) 
        ORDER BY total DESC
      ), '[]'::jsonb)
      FROM (
        SELECT seguradora, count(*) as total
        FROM (
          SELECT seguradora FROM public.apolices_beneficios
          UNION ALL
          SELECT seguradora FROM public.policies
        ) combined
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
$function$;