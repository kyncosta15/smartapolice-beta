-- Criar função para limpar dados de teste e debug das funções de empresa
CREATE OR REPLACE FUNCTION public.debug_user_empresa_complete()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_auth_id uuid;
  user_email text;
  user_role text;
  user_company text;
  empresa_name text;
  empresa_by_name uuid;
  empresa_by_membership uuid;
  membership_count integer;
  empresas_list jsonb;
  memberships_list jsonb;
BEGIN
  -- Get current authenticated user
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;
  
  -- Get user details
  SELECT email INTO user_email FROM auth.users WHERE id = user_auth_id;
  SELECT role, company INTO user_role, user_company FROM users WHERE id = user_auth_id;
  
  -- Build empresa name
  empresa_name := 'Cliente - ' || user_email;
  
  -- Check empresa by name
  SELECT id INTO empresa_by_name FROM empresas WHERE nome = empresa_name;
  
  -- Check empresa by membership
  SELECT um.empresa_id INTO empresa_by_membership 
  FROM user_memberships um 
  WHERE um.user_id = user_auth_id AND um.role = 'owner' 
  LIMIT 1;
  
  -- Count memberships
  SELECT count(*) INTO membership_count 
  FROM user_memberships 
  WHERE user_id = user_auth_id;
  
  -- Get all empresas for this user
  SELECT jsonb_agg(jsonb_build_object('id', id, 'nome', nome)) 
  INTO empresas_list
  FROM empresas 
  WHERE nome = empresa_name OR id IN (
    SELECT empresa_id FROM user_memberships WHERE user_id = user_auth_id
  );
  
  -- Get all memberships for this user
  SELECT jsonb_agg(jsonb_build_object('empresa_id', empresa_id, 'role', role, 'status', status)) 
  INTO memberships_list
  FROM user_memberships 
  WHERE user_id = user_auth_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_auth_id,
    'user_email', user_email,
    'user_role', user_role,
    'user_company', user_company,
    'expected_empresa_name', empresa_name,
    'empresa_by_name', empresa_by_name,
    'empresa_by_membership', empresa_by_membership,
    'membership_count', membership_count,
    'empresas_found', empresas_list,
    'memberships_found', memberships_list
  );
END;
$$;

-- Criar função para limpar dados de teste/erro
CREATE OR REPLACE FUNCTION public.limpar_dados_usuario_teste()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_auth_id uuid;
  user_email text;
  empresa_name text;
  empresa_id uuid;
  veiculos_deletados integer;
  memberships_deletadas integer;
  empresas_deletadas integer;
BEGIN
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  SELECT email INTO user_email FROM auth.users WHERE id = user_auth_id;
  empresa_name := 'Cliente - ' || user_email;
  
  -- Buscar empresa do usuário
  SELECT id INTO empresa_id FROM empresas WHERE nome = empresa_name;
  
  -- Deletar veículos da empresa do usuário
  DELETE FROM frota_veiculos WHERE empresa_id = empresa_id;
  GET DIAGNOSTICS veiculos_deletados = ROW_COUNT;
  
  -- Deletar memberships do usuário
  DELETE FROM user_memberships WHERE user_id = user_auth_id;
  GET DIAGNOSTICS memberships_deletadas = ROW_COUNT;
  
  -- Deletar empresa se existir
  DELETE FROM empresas WHERE id = empresa_id AND nome = empresa_name;
  GET DIAGNOSTICS empresas_deletadas = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_auth_id,
    'user_email', user_email,
    'empresa_name', empresa_name,
    'veiculos_deletados', veiculos_deletados,
    'memberships_deletadas', memberships_deletadas,
    'empresas_deletadas', empresas_deletadas
  );
END;
$$;