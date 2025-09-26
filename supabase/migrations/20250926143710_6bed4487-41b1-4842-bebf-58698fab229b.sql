-- Fix current_empresa_id function for proper client user handling
CREATE OR REPLACE FUNCTION public.current_empresa_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  user_auth_id uuid;
  user_role_val text;
  result_id uuid;
BEGIN
  -- Get current authenticated user
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RAISE LOG 'DEBUG current_empresa_id: Usuário não autenticado';
    RETURN NULL;
  END IF;
  
  -- Get user role
  SELECT role INTO user_role_val FROM users WHERE id = user_auth_id;
  RAISE LOG 'DEBUG current_empresa_id: user_id=%, role=%', user_auth_id, user_role_val;
  
  -- Para usuários tipo 'cliente', usar empresa do membership primeiro
  IF user_role_val = 'cliente' THEN
    RAISE LOG 'DEBUG current_empresa_id: Usuário é cliente, buscando membership';
    
    -- Primeiro tentar obter empresa através do membership
    SELECT um.empresa_id INTO result_id
    FROM user_memberships um
    WHERE um.user_id = user_auth_id
    LIMIT 1;
    
    IF result_id IS NOT NULL THEN
      RAISE LOG 'DEBUG current_empresa_id: Encontrou membership, empresa_id=%', result_id;
      RETURN result_id;
    ELSE
      RAISE LOG 'DEBUG current_empresa_id: Não encontrou membership, usando empresa padrão';
      -- Se não tem membership, usar empresa padrão
      RETURN '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;
  ELSE
    RAISE LOG 'DEBUG current_empresa_id: Usuário não é cliente, usando lógica padrão';
    -- Para outros roles, usar lógica existente
    SELECT COALESCE(
      (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = user_auth_id LIMIT 1),
      (SELECT e.id FROM public.empresas e 
       JOIN public.users u ON u.company::text = e.nome 
       WHERE u.id = user_auth_id LIMIT 1),
      '00000000-0000-0000-0000-000000000001'::uuid
    ) INTO result_id;
    RAISE LOG 'DEBUG current_empresa_id: Lógica padrão retornou: %', result_id;
    RETURN result_id;
  END IF;
END;
$$;