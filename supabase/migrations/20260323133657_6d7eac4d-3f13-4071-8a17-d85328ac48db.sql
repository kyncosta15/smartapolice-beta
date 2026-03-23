-- Drop existing overly-permissive RLS policies
DROP POLICY IF EXISTS "Users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update documents" ON public.documents;

-- Create account-scoped RLS policies
CREATE POLICY "Users can view own account documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own account documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  account_id IN (
    SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own account documents"
ON public.documents FOR UPDATE
TO authenticated
USING (
  account_id IN (
    SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own account documents"
ON public.documents FOR DELETE
TO authenticated
USING (
  account_id IN (
    SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()
  )
);