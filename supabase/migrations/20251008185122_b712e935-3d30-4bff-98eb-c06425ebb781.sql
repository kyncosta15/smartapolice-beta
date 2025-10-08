-- Atualizar função admin_companies_summary para não usar epoch
CREATE OR REPLACE FUNCTION public.admin_companies_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_admin boolean;
  _max_updated timestamptz;
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
        'conta_nome', (
          SELECT u.name 
          FROM public.users u
          JOIN public.user_memberships um ON um.user_id = u.id
          WHERE um.empresa_id = emp.id
          ORDER BY um.created_at ASC
          LIMIT 1
        ),
        'conta_email', (
          SELECT u.email 
          FROM public.users u
          JOIN public.user_memberships um ON um.user_id = u.id
          WHERE um.empresa_id = emp.id
          ORDER BY um.created_at ASC
          LIMIT 1
        ),
        'usuarios', (
          SELECT count(*) 
          FROM public.user_memberships um
          WHERE um.empresa_id = emp.id
        ),
        'veiculos', (
          SELECT count(*) 
          FROM public.frota_veiculos v 
          WHERE v.empresa_id = emp.id
        ),
        'apolices', (
          SELECT (
            COALESCE((SELECT count(*) FROM public.apolices_beneficios ab WHERE ab.empresa_id = emp.id), 0) +
            COALESCE((SELECT count(*) FROM public.policies p 
              WHERE p.user_id IN (
                SELECT um.user_id FROM public.user_memberships um WHERE um.empresa_id = emp.id
              )), 0)
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
        'ultima_atividade', (
          SELECT greatest(
            (SELECT max(updated_at) FROM public.frota_veiculos WHERE empresa_id = emp.id),
            (SELECT max(updated_at) FROM public.apolices_beneficios WHERE empresa_id = emp.id),
            (SELECT max(created_at) FROM public.tickets WHERE empresa_id = emp.id)
          )
        )
      )
    ), '[]'::jsonb)
    FROM public.empresas emp
  );
END;
$function$;