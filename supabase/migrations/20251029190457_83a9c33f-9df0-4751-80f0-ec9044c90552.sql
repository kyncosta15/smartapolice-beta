-- Atualizar função handle_new_user para salvar documento (CPF/CNPJ)
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
  user_document text;
  company_name text;
  user_specific_company_id uuid;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_classification := COALESCE(NEW.raw_user_meta_data->>'classification', 'Corretora');
  user_document := NEW.raw_user_meta_data->>'document';

  -- Validate role
  IF user_role NOT IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'financeiro') THEN
    user_role := 'cliente';
  END IF;

  -- Insert into users table com documento
  INSERT INTO public.users (
    id, email, name, password_hash, role, company, phone, classification, documento, status, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, 'managed_by_auth', user_role, 'Clientes Individuais', 
    user_phone, user_classification, user_document, 'active', now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create company for clients
  IF user_role = 'cliente' THEN
    company_name := 'Cliente - ' || NEW.email;
    
    -- Try to create company, ignore if exists
    BEGIN
      INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
      VALUES (company_name, REPLACE(NEW.email, '@', ''), now(), now());
    EXCEPTION
      WHEN OTHERS THEN
        -- Company probably exists, get its ID
        NULL;
    END;
    
    -- Get company ID
    SELECT id INTO user_specific_company_id FROM public.empresas WHERE nome = company_name;
    
    -- Create membership if company was found
    IF user_specific_company_id IS NOT NULL THEN
      INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
      VALUES (NEW.id, user_specific_company_id, 'owner', now())
      ON CONFLICT (user_id, empresa_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();