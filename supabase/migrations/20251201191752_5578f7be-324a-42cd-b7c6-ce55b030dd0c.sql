-- Habilitar pg_net para fazer HTTP requests (se não estiver habilitado)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função para enviar email de boas-vindas
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_name text;
BEGIN
  -- Pegar email e nome do usuário recém criado
  user_email := NEW.email;
  user_name := NEW.name;
  
  -- Chamar edge function via pg_net
  PERFORM net.http_post(
    url := 'https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg'
    ),
    body := jsonb_build_object(
      'userId', NEW.id::text,
      'email', user_email,
      'name', user_name
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Não bloquear criação do usuário se o email falhar
    RAISE LOG 'Erro ao enviar email de boas-vindas para %: %', user_email, SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger que dispara após inserção na tabela users
DROP TRIGGER IF EXISTS on_user_created_send_welcome ON public.users;

CREATE TRIGGER on_user_created_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();