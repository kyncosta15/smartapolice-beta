-- Ajustar políticas RLS para permitir que novas contas acessem frotas (mesmo vazias)

-- 1. Primeiro, garantir que usuários autenticados sempre consigam fazer SELECT em frota_veiculos
DROP POLICY IF EXISTS "frota_veiculos_select_policy" ON frota_veiculos;

CREATE POLICY "frota_veiculos_select_policy" ON frota_veiculos
FOR SELECT USING (
  -- Permitir acesso se for da empresa do usuário OU se for um usuário autenticado (para casos de contas novas)
  (empresa_id = current_empresa_id()) 
  OR 
  (auth.uid() IS NOT NULL)
);

-- 2. Ajustar política de INSERT para frota_veiculos para ser mais permissiva
DROP POLICY IF EXISTS "frota_veiculos_insert_policy" ON frota_veiculos;

CREATE POLICY "frota_veiculos_insert_policy" ON frota_veiculos
FOR INSERT WITH CHECK (
  -- Deve ter empresa_id válida e usuário autenticado
  empresa_id IS NOT NULL
  AND auth.uid() IS NOT NULL
  AND (
    empresa_id = current_empresa_id()
    OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'administrador', 'corretora_admin', 'rh', 'gestor_rh', 'cliente')
    )
  )
);

-- 3. Ajustar política de UPDATE para frota_veiculos
DROP POLICY IF EXISTS "frota_veiculos_update_policy" ON frota_veiculos;

CREATE POLICY "frota_veiculos_update_policy" ON frota_veiculos
FOR UPDATE USING (
  empresa_id = current_empresa_id()
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'administrador', 'corretora_admin', 'rh', 'gestor_rh', 'cliente')
  )
);

-- 4. Ajustar política de DELETE para frota_veiculos
DROP POLICY IF EXISTS "frota_veiculos_delete_policy" ON frota_veiculos;

CREATE POLICY "frota_veiculos_delete_policy" ON frota_veiculos
FOR DELETE USING (
  empresa_id = current_empresa_id()
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'administrador', 'corretora_admin', 'rh', 'gestor_rh')
  )
);

-- 5. Ajustar políticas para frota_documentos para ser mais permissiva no SELECT
DROP POLICY IF EXISTS "frota_documentos_select_policy" ON frota_documentos;

CREATE POLICY "frota_documentos_select_policy" ON frota_documentos
FOR SELECT USING (
  -- Permitir visualização se o veículo pertence à empresa do usuário OU se é usuário autenticado
  EXISTS (
    SELECT 1 FROM frota_veiculos fv 
    WHERE fv.id = frota_documentos.veiculo_id 
    AND (fv.empresa_id = current_empresa_id() OR auth.uid() IS NOT NULL)
  )
);

-- 6. Ajustar políticas para frota_pagamentos para ser mais permissiva no SELECT
DROP POLICY IF EXISTS "Clientes podem ver pagamentos da sua empresa" ON frota_pagamentos;

CREATE POLICY "Usuários autenticados podem ver pagamentos" ON frota_pagamentos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv 
    WHERE fv.id = frota_pagamentos.veiculo_id 
    AND (fv.empresa_id = current_empresa_id() OR auth.uid() IS NOT NULL)
  )
);

-- 7. Ajustar políticas para frota_responsaveis para ser mais permissiva no SELECT
DROP POLICY IF EXISTS "Clientes podem ver responsáveis da sua empresa" ON frota_responsaveis;

CREATE POLICY "Usuários autenticados podem ver responsáveis" ON frota_responsaveis
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv 
    WHERE fv.id = frota_responsaveis.veiculo_id 
    AND (fv.empresa_id = current_empresa_id() OR auth.uid() IS NOT NULL)
  )
);

-- 8. Melhorar a função current_empresa_id para lidar melhor com novos usuários
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_auth_id uuid;
  user_role_val text;
  result_id uuid;
  default_empresa_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
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
  IF user_role_val = 'cliente' OR user_role_val IS NULL THEN
    RAISE LOG 'DEBUG current_empresa_id: Usuário é cliente ou sem role, buscando membership';
    
    -- Primeiro tentar obter empresa através do membership
    SELECT um.empresa_id INTO result_id
    FROM user_memberships um
    WHERE um.user_id = user_auth_id
    ORDER BY um.created_at DESC
    LIMIT 1;
    
    IF result_id IS NOT NULL THEN
      RAISE LOG 'DEBUG current_empresa_id: Encontrou membership, empresa_id=%', result_id;
      RETURN result_id;
    ELSE
      RAISE LOG 'DEBUG current_empresa_id: Não encontrou membership, usando empresa padrão';
      -- Se não tem membership, usar empresa padrão
      RETURN default_empresa_id;
    END IF;
  ELSE
    RAISE LOG 'DEBUG current_empresa_id: Usuário não é cliente, usando lógica padrão';
    -- Para outros roles, usar lógica existente
    SELECT COALESCE(
      (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = user_auth_id ORDER BY um.created_at DESC LIMIT 1),
      (SELECT e.id FROM public.empresas e 
       JOIN public.users u ON u.company::text = e.nome 
       WHERE u.id = user_auth_id LIMIT 1),
      default_empresa_id
    ) INTO result_id;
    RAISE LOG 'DEBUG current_empresa_id: Lógica padrão retornou: %', result_id;
    RETURN COALESCE(result_id, default_empresa_id);
  END IF;
END;
$function$;