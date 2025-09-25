-- Função para testar se funciona via RPC
CREATE OR REPLACE FUNCTION public.test_get_user_empresa()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_auth_id uuid;
  user_role_val text;
  empresa_result uuid;
BEGIN
  -- Get current authenticated user
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado',
      'auth_uid', user_auth_id
    );
  END IF;
  
  -- Get user role
  SELECT role INTO user_role_val FROM users WHERE id = user_auth_id;
  
  IF user_role_val = 'cliente' THEN
    -- Call get_user_empresa_id function
    SELECT get_user_empresa_id() INTO empresa_result;
    
    RETURN jsonb_build_object(
      'success', true,
      'user_id', user_auth_id,
      'user_role', user_role_val,
      'empresa_id', empresa_result,
      'message', 'Empresa criada/obtida com sucesso'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'user_id', user_auth_id,
      'user_role', user_role_val,
      'message', 'Usuário não é cliente'
    );
  END IF;
END;
$$;