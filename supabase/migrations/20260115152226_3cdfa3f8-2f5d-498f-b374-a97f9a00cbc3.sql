-- Política para admins verem todos os logs de acesso
CREATE POLICY "Admins can view all access logs"
ON public.user_access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);