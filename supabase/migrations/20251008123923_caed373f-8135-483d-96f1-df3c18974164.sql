-- Criar policy mais clara para admins lerem todas as solicitações
DROP POLICY IF EXISTS "admin_read_all_approvals" ON public.insurance_approval_requests;
DROP POLICY IF EXISTS "admin_all_requests" ON public.insurance_approval_requests;

-- Policy para admins lerem todas as solicitações
CREATE POLICY "admins_read_all_insurance_requests"
ON public.insurance_approval_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'administrador', 'corretora_admin')
  )
);

-- Policy para admins atualizarem solicitações
CREATE POLICY "admins_update_insurance_requests"
ON public.insurance_approval_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'administrador', 'corretora_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role IN ('admin', 'administrador', 'corretora_admin')
  )
);