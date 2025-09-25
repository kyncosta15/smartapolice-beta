-- Fix infinite recursion in user_memberships RLS policies

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage company memberships" ON public.user_memberships;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_company_admin(check_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Check if user is a general admin
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY (ARRAY['admin', 'administrador', 'corretora_admin'])
    ) THEN true
    -- Check if user is admin of this specific company
    WHEN EXISTS (
      SELECT 1 FROM user_memberships um
      WHERE um.user_id = auth.uid() 
      AND um.empresa_id = check_empresa_id 
      AND um.role = ANY (ARRAY['owner', 'admin'])
    ) THEN true
    ELSE false
  END;
$$;

-- Create a safe policy using the security definer function
CREATE POLICY "Company admins can manage memberships" 
ON public.user_memberships
FOR ALL
USING (public.is_company_admin(empresa_id))
WITH CHECK (public.is_company_admin(empresa_id));