-- Simplificar correção para novos usuários

-- 1. Recriar o trigger simples que funciona
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
  company_name text;
  user_specific_company_id uuid;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
  user_phone := NEW.raw_user_meta_data->>'phone';
  user_classification := COALESCE(NEW.raw_user_meta_data->>'classification', 'Corretora');

  -- Validate role
  IF user_role NOT IN ('cliente', 'rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'financeiro') THEN
    user_role := 'cliente';
  END IF;

  -- Insert into users table
  INSERT INTO public.users (
    id, email, name, password_hash, role, company, phone, classification, status, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, user_name, 'managed_by_auth', user_role, 'Clientes Individuais', 
    user_phone, user_classification, 'active', now(), now()
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

-- 2. Permitir que usuários autenticados vejam qualquer empresa (para novos usuários)
DROP POLICY IF EXISTS "Usuários autenticados podem ver todas as empresas" ON empresas;

CREATE POLICY "Usuários autenticados podem ver todas as empresas" ON empresas
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Permitir que usuários autenticados criem empresas com seu nome
DROP POLICY IF EXISTS "Usuários podem criar sua própria empresa" ON empresas;

CREATE POLICY "Usuários podem criar sua própria empresa" ON empresas
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  nome LIKE 'Cliente - %'
);

-- 4. Configurar usuário de teste atual manualmente
INSERT INTO public.users (
  id, email, name, password_hash, role, company, phone, classification, status, created_at, updated_at
) VALUES (
  'e78bec0a-20d3-42ff-bbcb-8c9a588164f3', 
  'thiagoncosta65@gmail.com', 
  'Uusario 3', 
  'managed_by_auth', 
  'cliente', 
  'Clientes Individuais',
  '71992310958',
  'Corretora',
  'active', 
  now(), 
  now()
) ON CONFLICT (id) DO NOTHING;

-- 5. Criar empresa para o usuário de teste
INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
VALUES ('Cliente - thiagoncosta65@gmail.com', 'thiagoncosta65gmail.com', now(), now())
ON CONFLICT DO NOTHING;

-- 6. Criar membership para o usuário de teste
INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
SELECT 
  'e78bec0a-20d3-42ff-bbcb-8c9a588164f3'::uuid,
  e.id,
  'owner',
  now()
FROM public.empresas e 
WHERE e.nome = 'Cliente - thiagoncosta65@gmail.com'
ON CONFLICT (user_id, empresa_id) DO NOTHING;