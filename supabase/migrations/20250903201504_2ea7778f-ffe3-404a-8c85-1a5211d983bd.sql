-- Reverter para sistema simples com duas roles específicas
-- Remover função desnecessária
DROP FUNCTION IF EXISTS public.get_current_user_profile_role();

-- Atualizar tabela profiles para usar as roles corretas
-- Verificar se a coluna role já existe e ajustar os valores
UPDATE public.profiles 
SET role = CASE 
  WHEN role = 'administrador' THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh' 
  ELSE 'gestor_rh'
END;

-- Atualizar tabela users também
UPDATE public.users 
SET role = CASE 
  WHEN role = 'administrador' THEN 'corretora_admin'
  WHEN role = 'rh' THEN 'gestor_rh'
  WHEN role = 'admin' THEN 'corretora_admin'
  ELSE 'gestor_rh'
END;

-- Criar função simples para verificar role do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Recriar políticas RLS para profiles usando a função correta
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Corretora admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() = 'corretora_admin');

CREATE POLICY "Corretora admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'corretora_admin');