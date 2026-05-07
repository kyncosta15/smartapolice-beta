INSERT INTO public.user_roles (user_id, role)
SELECT u.id, u.role::public.app_role
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id AND ur.role::text = u.role
  )
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::public.app_role
FROM public.user_profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin'::public.app_role, 'administrador'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role::text
    WHEN 'admin' THEN 1
    WHEN 'administrador' THEN 2
    WHEN 'corretora_admin' THEN 3
    WHEN 'gestor_rh' THEN 4
    WHEN 'rh' THEN 5
    ELSE 99
  END
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Permission denied: cannot modify role';
    END IF;
  ELSIF TG_TABLE_NAME = 'user_profiles' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Permission denied: cannot modify is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_users_role_self_escalation ON public.users;
CREATE TRIGGER prevent_users_role_self_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

DROP TRIGGER IF EXISTS prevent_profiles_admin_self_escalation ON public.user_profiles;
CREATE TRIGGER prevent_profiles_admin_self_escalation
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_admin_write" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());