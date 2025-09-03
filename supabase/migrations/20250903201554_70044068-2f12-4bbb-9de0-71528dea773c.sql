-- Primeiro, remover as políticas que dependem da função
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.get_current_user_profile_role();

-- Remover a constraint de check da coluna role na tabela users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Agora fazer as atualizações das roles
UPDATE public.profiles 
SET role = CASE 
  WHEN role IN ('administrador', 'admin') THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh' 
  ELSE 'gestor_rh'
END;

UPDATE public.users 
SET role = CASE 
  WHEN role IN ('administrador', 'admin') THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh'
  ELSE 'gestor_rh'
END;

-- Recriar a constraint com os novos valores permitidos
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role::text = ANY (ARRAY['gestor_rh'::character varying, 'corretora_admin'::character varying]::text[]));

-- Criar função para verificar role atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Criar políticas RLS para as duas roles
CREATE POLICY "Corretora admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'corretora_admin');

CREATE POLICY "Corretora admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'corretora_admin');