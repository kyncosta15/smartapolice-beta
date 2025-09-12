-- Atualizar a função rh_employee_request para criar solicitações que vão para aprovação do Admin
CREATE OR REPLACE FUNCTION public.rh_employee_request(request_kind text, employee_data jsonb, observacoes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  protocol_code text;
  request_id uuid;
  company_id uuid;
  user_company text;
  user_role text;
BEGIN
  -- Buscar empresa e role do usuário
  SELECT company, role INTO user_company, user_role
  FROM users
  WHERE id = auth.uid();
  
  IF user_company IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', jsonb_build_object('message', 'Empresa não encontrada'));
  END IF;
  
  -- Verificar se o usuário tem permissão (RH ou Admin)
  IF user_role NOT IN ('rh', 'admin', 'administrador', 'corretora_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', jsonb_build_object('message', 'Sem permissão para criar solicitações'));
  END IF;
  
  -- Buscar ID da empresa
  SELECT id INTO company_id
  FROM empresas
  WHERE nome = user_company;
  
  IF company_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', jsonb_build_object('message', 'Empresa não encontrada no sistema'));
  END IF;
  
  -- Gerar protocolo único
  protocol_code := generate_protocol_code();
  
  -- Criar solicitação
  -- Se for RH, status inicial é 'aguardando_aprovacao' (para Admin aprovar)
  -- Se for Admin, poderia ser 'aprovado' direto (mas Admin usa cadastro direto)
  INSERT INTO requests (
    protocol_code,
    kind,
    status,
    submitted_at,
    draft,
    channel,
    metadata
  ) VALUES (
    protocol_code,
    request_kind,
    CASE 
      WHEN user_role = 'rh' THEN 'aguardando_aprovacao'
      ELSE 'aprovado_rh'
    END,
    now(),
    false,
    'rh_portal',
    jsonb_build_object(
      'employee_data', employee_data,
      'observacoes', observacoes,
      'company_id', company_id,
      'created_by', auth.uid(),
      'created_by_role', user_role
    )
  ) RETURNING id INTO request_id;
  
  RETURN jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'request_id', request_id,
      'protocol_code', protocol_code,
      'status', CASE 
        WHEN user_role = 'rh' THEN 'aguardando_aprovacao'
        ELSE 'aprovado_rh'
      END
    )
  );
END;
$$;