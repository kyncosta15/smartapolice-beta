-- Edge function para criar solicitações de colaboradores RH
CREATE OR REPLACE FUNCTION rh_employee_request(
  request_kind text,
  employee_data jsonb,
  observacoes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  protocol_code text;
  request_id uuid;
  company_id uuid;
  user_company text;
BEGIN
  -- Buscar empresa do usuário
  SELECT company INTO user_company
  FROM users
  WHERE id = auth.uid();
  
  IF user_company IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', jsonb_build_object('message', 'Empresa não encontrada'));
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
    'aguardando_aprovacao',
    now(),
    false,
    'rh_portal',
    jsonb_build_object(
      'employee_data', employee_data,
      'observacoes', observacoes,
      'company_id', company_id,
      'created_by', auth.uid()
    )
  ) RETURNING id INTO request_id;
  
  RETURN jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'request_id', request_id,
      'protocol_code', protocol_code,
      'status', 'aguardando_aprovacao'
    )
  );
END;
$$;