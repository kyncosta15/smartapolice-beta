-- Criar função para obter ou criar empresa específica do usuário
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  empresa_name text;
  empresa_id uuid;
BEGIN
  -- Obter email do usuário atual
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Criar nome da empresa baseado no email
  empresa_name := 'Cliente - ' || user_email;
  
  -- Verificar se empresa já existe
  SELECT id INTO empresa_id 
  FROM empresas 
  WHERE nome = empresa_name;
  
  -- Se não existe, criar
  IF empresa_id IS NULL THEN
    INSERT INTO empresas (nome, cnpj, created_at, updated_at)
    VALUES (empresa_name, REPLACE(user_email, '@', ''), now(), now())
    RETURNING id INTO empresa_id;
    
    -- Criar membership para o usuário
    INSERT INTO user_memberships (user_id, empresa_id, role, created_at)
    VALUES (auth.uid(), empresa_id, 'owner', now())
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
  END IF;
  
  RETURN empresa_id;
END;
$$;

-- Atualizar função current_empresa_id para usar a nova lógica
CREATE OR REPLACE FUNCTION public.current_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Para usuários tipo 'cliente', usar empresa específica do usuário
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'cliente') THEN
      get_user_empresa_id()
    ELSE
      -- Para outros roles, usar lógica existente
      COALESCE(
        (SELECT um.empresa_id FROM public.user_memberships um WHERE um.user_id = auth.uid() LIMIT 1),
        (SELECT e.id FROM public.empresas e 
         JOIN public.users u ON u.company::text = e.nome 
         WHERE u.id = auth.uid() LIMIT 1),
        '00000000-0000-0000-0000-000000000001'::uuid
      )
  END;
$$;