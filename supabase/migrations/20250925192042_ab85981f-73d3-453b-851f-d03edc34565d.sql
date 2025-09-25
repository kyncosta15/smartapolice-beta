-- Corrigir função get_user_empresa_id para não tentar INSERT se empresa não existe
-- A empresa já deveria ter sido criada automaticamente no cadastro
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
  user_membership_id uuid;
BEGIN
  -- Primeiro, tentar obter empresa através do membership
  SELECT um.empresa_id INTO empresa_id
  FROM user_memberships um
  WHERE um.user_id = auth.uid()
  AND um.role = 'owner'
  LIMIT 1;
  
  IF empresa_id IS NOT NULL THEN
    RETURN empresa_id;
  END IF;
  
  -- Se não encontrou por membership, buscar por nome baseado no email
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
  
  IF empresa_id IS NOT NULL THEN
    -- Se empresa existe mas não tem membership, criar o membership
    INSERT INTO user_memberships (user_id, empresa_id, role, status, created_at)
    VALUES (auth.uid(), empresa_id, 'owner', 'active', now())
    ON CONFLICT (user_id, empresa_id) DO NOTHING;
    
    RETURN empresa_id;
  END IF;
  
  -- Se chegou até aqui, significa que não há empresa e não pode criar aqui
  -- (deve ser criada pelo trigger handle_new_user)
  RAISE EXCEPTION 'Empresa não encontrada para o usuário. Entre em contato com o suporte.';
END;
$$;

-- Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();