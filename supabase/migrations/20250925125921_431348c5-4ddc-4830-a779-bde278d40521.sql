-- Criar função de debug para investigar RLS
CREATE OR REPLACE FUNCTION public.debug_frota_auth()
RETURNS TABLE(
  auth_user_id uuid,
  current_empresa_result uuid,
  membership_count integer,
  user_company text,
  total_vehicles_no_rls integer,
  total_vehicles_with_rls integer,
  user_memberships jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id uuid;
  v_current_empresa uuid;
  v_membership_count integer;
  v_user_company text;
  v_total_no_rls integer;
  v_total_with_rls integer;
  v_memberships jsonb;
BEGIN
  -- Get current auth user
  v_auth_user_id := auth.uid();
  
  -- Test current_empresa_id function
  v_current_empresa := current_empresa_id();
  
  -- Count memberships
  SELECT count(*) INTO v_membership_count
  FROM user_memberships
  WHERE user_id = v_auth_user_id;
  
  -- Get user company from users table
  SELECT company INTO v_user_company
  FROM users
  WHERE id = v_auth_user_id;
  
  -- Count vehicles without RLS
  SELECT count(*) INTO v_total_no_rls
  FROM frota_veiculos;
  
  -- Count vehicles with RLS (what user should see)
  SELECT count(*) INTO v_total_with_rls
  FROM frota_veiculos
  WHERE empresa_id = v_current_empresa;
  
  -- Get memberships JSON
  SELECT jsonb_agg(jsonb_build_object(
    'empresa_id', empresa_id,
    'role', role,
    'status', status
  )) INTO v_memberships
  FROM user_memberships
  WHERE user_id = v_auth_user_id;
  
  RETURN QUERY SELECT 
    v_auth_user_id,
    v_current_empresa,
    v_membership_count,
    v_user_company,
    v_total_no_rls,
    v_total_with_rls,
    v_memberships;
END;
$$;