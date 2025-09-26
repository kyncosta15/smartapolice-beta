-- Fix para novos usuários - versão sem ON CONFLICT

-- 1. Corrigir o trigger handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role text;
  user_name text;
  user_phone text;
  user_classification text;
  user_specific_company_id uuid;
  company_name text;
  existing_user_count integer;
  existing_company_count integer;
  existing_membership_count integer;
BEGIN
  -- Extract and validate user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_classification := COALESCE(NEW.raw_user_meta_data->>'classification', 'Corretora');

  -- Validate role
  IF user_role NOT IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'financeiro') THEN
    user_role := 'cliente';
  END IF;

  -- Check if user already exists
  SELECT COUNT(*) INTO existing_user_count FROM public.users WHERE id = NEW.id;
  
  IF existing_user_count = 0 THEN
    -- Insert into users table
    INSERT INTO public.users (
      id, email, name, password_hash, role, company, phone, classification, status, created_at, updated_at
    ) VALUES (
      NEW.id, NEW.email, user_name, 'managed_by_auth', user_role, 'Clientes Individuais', 
      user_phone, user_classification, 'active', now(), now()
    );
  END IF;

  -- Create user-specific company for all users
  company_name := 'Cliente - ' || NEW.email;
  
  SELECT COUNT(*) INTO existing_company_count FROM public.empresas WHERE nome = company_name;
  
  IF existing_company_count = 0 THEN
    INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
    VALUES (company_name, REPLACE(NEW.email, '@', ''), now(), now())
    RETURNING id INTO user_specific_company_id;
  ELSE
    SELECT id INTO user_specific_company_id FROM public.empresas WHERE nome = company_name;
  END IF;
  
  -- Create membership
  SELECT COUNT(*) INTO existing_membership_count 
  FROM public.user_memberships 
  WHERE user_id = NEW.id AND empresa_id = user_specific_company_id;
  
  IF existing_membership_count = 0 THEN
    INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
    VALUES (NEW.id, user_specific_company_id, 'owner', now());
  END IF;
  
  -- Create or update user profile
  INSERT INTO public.user_profiles (id, display_name, default_empresa_id, created_at, updated_at)
  VALUES (NEW.id, user_name, user_specific_company_id, now(), now())
  ON CONFLICT (id) DO UPDATE SET 
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    default_empresa_id = COALESCE(EXCLUDED.default_empresa_id, user_profiles.default_empresa_id),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Permitir que qualquer usuário autenticado crie uma empresa com seu nome
DROP POLICY IF EXISTS "Usuários podem criar sua própria empresa" ON empresas;

CREATE POLICY "Usuários podem criar sua própria empresa" ON empresas
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  (nome = 'Cliente - ' || (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- 3. Processar usuários existentes manualmente
DO $$
DECLARE
  user_record RECORD;
  company_name text;
  company_id uuid;
BEGIN
  -- Para cada usuário no auth que não está no public.users
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.updated_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Inserir usuário
    INSERT INTO public.users (
      id, email, name, password_hash, role, company, phone, classification, status, created_at, updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.raw_user_meta_data->>'name', user_record.email),
      'managed_by_auth',
      COALESCE(user_record.raw_user_meta_data->>'role', 'cliente'),
      'Clientes Individuais',
      user_record.raw_user_meta_data->>'phone',
      COALESCE(user_record.raw_user_meta_data->>'classification', 'Corretora'),
      'active',
      user_record.created_at,
      user_record.updated_at
    );
    
    -- Criar empresa se não existir
    company_name := 'Cliente - ' || user_record.email;
    
    SELECT id INTO company_id FROM public.empresas WHERE nome = company_name;
    
    IF company_id IS NULL THEN
      INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
      VALUES (company_name, REPLACE(user_record.email, '@', ''), now(), now())
      RETURNING id INTO company_id;
    END IF;
    
    -- Criar membership se não existir
    IF NOT EXISTS (
      SELECT 1 FROM public.user_memberships 
      WHERE user_id = user_record.id AND empresa_id = company_id
    ) THEN
      INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
      VALUES (user_record.id, company_id, 'owner', now());
    END IF;
    
    -- Criar ou atualizar perfil
    INSERT INTO public.user_profiles (
      id, display_name, default_empresa_id, created_at, updated_at
    ) VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.raw_user_meta_data->>'name', user_record.email),
      company_id,
      now(),
      now()
    ) ON CONFLICT (id) DO UPDATE SET 
      default_empresa_id = COALESCE(user_profiles.default_empresa_id, EXCLUDED.default_empresa_id),
      updated_at = now();
      
  END LOOP;
END $$;