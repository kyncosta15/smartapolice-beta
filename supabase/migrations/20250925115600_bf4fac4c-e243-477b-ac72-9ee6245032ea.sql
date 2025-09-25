-- Assign new users to a default company if they don't have one
-- This prevents access issues for new clients

-- Insert default company for individual clients if it doesn't exist
INSERT INTO public.empresas (id, nome, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Clientes Individuais', 
  now(), 
  now()
) ON CONFLICT (id) DO NOTHING;

-- Update handle_new_user function to assign default company for client users
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

  -- Create user membership for individual clients
  IF user_role = 'cliente' THEN
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