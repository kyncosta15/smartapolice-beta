-- Primeiro, remover as políticas que dependem da função
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Agora posso remover a função
DROP FUNCTION IF EXISTS public.get_current_user_profile_role();

-- Simplificar sistema para duas roles específicas
-- Atualizar tabela profiles
UPDATE public.profiles 
SET role = CASE 
  WHEN role IN ('administrador', 'admin') THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh' 
  ELSE 'gestor_rh'
END;

-- Atualizar tabela users
UPDATE public.users 
SET role = CASE 
  WHEN role IN ('administrador', 'admin') THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh'
  ELSE 'gestor_rh'
END;

-- Criar função simples para verificar role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Criar políticas RLS simples para as duas roles
CREATE POLICY "Corretora admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'corretora_admin');

CREATE POLICY "Corretora admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'corretora_admin');