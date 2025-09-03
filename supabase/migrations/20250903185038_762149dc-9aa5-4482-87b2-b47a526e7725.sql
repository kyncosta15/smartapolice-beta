-- Corrigir função para definir search_path corretamente
CREATE OR REPLACE FUNCTION public.can_access_requests()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin' OR u.role = 'administrador')
  );
$$;