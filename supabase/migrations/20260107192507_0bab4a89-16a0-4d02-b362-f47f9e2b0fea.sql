-- =====================================================
-- SEGURANÇA: Criar tabela de roles e proteger tabelas
-- =====================================================

-- 1. Criar enum para roles (se não existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'rh', 'corretora');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela user_roles separada (segura)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função SECURITY DEFINER para checar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. Migrar roles existentes de users para user_roles (apenas usuários válidos)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 
  CASE 
    WHEN u.role IN ('admin', 'administrador') THEN 'admin'::app_role
    WHEN u.role = 'rh' THEN 'rh'::app_role
    WHEN u.role = 'corretora' THEN 'corretora'::app_role
    WHEN u.role = 'moderator' THEN 'moderator'::app_role
    ELSE 'user'::app_role
  END
FROM public.users u
INNER JOIN auth.users au ON u.id = au.id
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Migrar admins de user_profiles
INSERT INTO public.user_roles (user_id, role)
SELECT up.id, 'admin'::app_role
FROM public.user_profiles up
INNER JOIN auth.users au ON up.id = au.id
WHERE up.is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Policies para user_roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_all"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 10. Policies para users
CREATE POLICY "users_select_own_or_admin"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users_admin_manage"
ON public.users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Atualizar função is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()),
    false
  );
$$;