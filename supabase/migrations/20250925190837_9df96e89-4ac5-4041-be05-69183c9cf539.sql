-- Modificar função handle_new_user para criar empresa automaticamente para clientes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  user_company text;
  user_name text;
  user_phone text;
  user_classification text;
  default_company_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  user_specific_company_id uuid;
BEGIN
  -- Extract and validate user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
  user_company := COALESCE(NEW.raw_user_meta_data->>'company', '');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_classification := COALESCE(NEW.raw_user_meta_data->>'classification', 'Corretora');

  -- Validate role against allowed values
  IF user_role NOT IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'financeiro') THEN
    user_role := 'cliente'; -- fallback to default
  END IF;

  -- For client users without company, assign to default company
  IF user_role = 'cliente' AND (user_company = '' OR user_company IS NULL) THEN
    user_company := 'Clientes Individuais';
  END IF;

  -- Insert into users table with validated data
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    password_hash,
    role, 
    company,
    phone,
    classification,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    'managed_by_auth',
    user_role,
    user_company,
    user_phone,
    user_classification,
    'active',
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    role = COALESCE(EXCLUDED.role, users.role),
    company = COALESCE(EXCLUDED.company, users.company),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    classification = COALESCE(EXCLUDED.classification, users.classification),
    updated_at = now();
    
  -- Insert into profiles table with validated data
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    company
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    user_company
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    company = COALESCE(EXCLUDED.company, profiles.company);

  -- Create user-specific company for clients
  IF user_role = 'cliente' THEN
    -- Create user-specific company
    INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
    VALUES (
      'Cliente - ' || NEW.email, 
      REPLACE(NEW.email, '@', ''), 
      now(), 
      now()
    )
    RETURNING id INTO user_specific_company_id;
    
    -- Create membership for the user with the specific company
    INSERT INTO public.user_memberships (
      user_id,
      empresa_id,
      role,
      status,
      created_at
    ) VALUES (
      NEW.id,
      user_specific_company_id,
      'owner',
      'active',
      now()
    ) ON CONFLICT (user_id, empresa_id) DO NOTHING;
    
    -- Update user profile with default company
    UPDATE public.user_profiles 
    SET default_empresa_id = user_specific_company_id
    WHERE id = NEW.id;
  ELSE
    -- For non-client users, use default company membership
    INSERT INTO public.user_memberships (
      user_id,
      empresa_id,
      role,
      status,
      created_at
    ) VALUES (
      NEW.id,
      default_company_id,
      'member',
      'active',
      now()
    ) ON CONFLICT (user_id, empresa_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to automatically handle new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();