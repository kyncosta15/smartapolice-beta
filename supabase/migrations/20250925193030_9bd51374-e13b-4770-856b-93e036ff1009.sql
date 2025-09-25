-- Corrigir função de limpeza para evitar ambiguidade de colunas
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
  SELECT e.id INTO empresa_id FROM empresas e WHERE e.nome = empresa_name;
  
  -- Deletar veículos da empresa do usuário (especificar tabela explicitamente)
  DELETE FROM frota_veiculos fv WHERE fv.empresa_id = empresa_id;
  GET DIAGNOSTICS veiculos_deletados = ROW_COUNT;
  
  -- Deletar memberships do usuário (especificar tabela explicitamente)
  DELETE FROM user_memberships um WHERE um.user_id = user_auth_id;
  GET DIAGNOSTICS memberships_deletadas = ROW_COUNT;
  
  -- Deletar empresa se existir (especificar tabela explicitamente)
  DELETE FROM empresas e WHERE e.id = empresa_id AND e.nome = empresa_name;
  GET DIAGNOSTICS empresas_deletadas = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_auth_id,
    'user_email', user_email,
    'empresa_name', empresa_name,
    'empresa_id', empresa_id,
    'veiculos_deletados', veiculos_deletados,
    'memberships_deletadas', memberships_deletadas,
    'empresas_deletadas', empresas_deletadas
  );
END;
$$;

-- Criar versão alternativa que usa subqueries para evitar conflitos
CREATE OR REPLACE FUNCTION public.limpar_dados_usuario_teste_v2()
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
  veiculos_deletados integer := 0;
  memberships_deletadas integer := 0;
  empresas_deletadas integer := 0;
BEGIN
  user_auth_id := auth.uid();
  
  IF user_auth_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  SELECT email INTO user_email FROM auth.users WHERE id = user_auth_id;
  empresa_name := 'Cliente - ' || user_email;
  
  -- Buscar ID da empresa do usuário
  SELECT id INTO empresa_id FROM empresas WHERE nome = empresa_name;
  
  -- Se encontrou empresa, deletar veículos
  IF empresa_id IS NOT NULL THEN
    DELETE FROM frota_veiculos WHERE empresa_id = empresa_id;
    GET DIAGNOSTICS veiculos_deletados = ROW_COUNT;
  END IF;
  
  -- Deletar todas as memberships do usuário
  DELETE FROM user_memberships WHERE user_id = user_auth_id;
  GET DIAGNOSTICS memberships_deletadas = ROW_COUNT;
  
  -- Se encontrou empresa, deletar ela
  IF empresa_id IS NOT NULL THEN
    DELETE FROM empresas WHERE id = empresa_id;
    GET DIAGNOSTICS empresas_deletadas = ROW_COUNT;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', user_auth_id,
    'user_email', user_email,
    'empresa_name', empresa_name,
    'empresa_id', empresa_id,
    'veiculos_deletados', veiculos_deletados,
    'memberships_deletadas', memberships_deletadas,
    'empresas_deletadas', empresas_deletadas
  );
END;
$$;