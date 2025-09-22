-- Melhorar a função handle_new_user para criar registros completos na tabela users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir na tabela users com dados dos metadados
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    'managed_by_auth',
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'classification', 'Corretora'),
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
    
  -- Inserir na tabela profiles também
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    company
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    company = COALESCE(EXCLUDED.company, profiles.company);

  RETURN NEW;
END;
$$;