-- Fix role constraints to align between users and profiles tables
-- Allow 'cliente' and 'financeiro' in both tables

-- Update profiles table constraint to include 'cliente'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['cliente'::text, 'gestor_rh'::text, 'corretora_admin'::text, 'rh'::text, 'admin'::text, 'administrador'::text, 'financeiro'::text]));

-- Update users table constraint to include 'financeiro' 
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role::text = ANY (ARRAY['cliente'::text, 'rh'::text, 'admin'::text, 'administrador'::text, 'corretora_admin'::text, 'gestor_rh'::text, 'financeiro'::text]));

-- Update handle_new_user function to use proper default role and handle errors
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;