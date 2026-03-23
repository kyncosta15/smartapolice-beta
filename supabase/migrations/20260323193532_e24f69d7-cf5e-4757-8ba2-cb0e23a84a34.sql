-- Allow empresa members to insert colaboradores for their own empresa
CREATE POLICY "Membros da empresa podem inserir colaboradores"
ON public.colaboradores
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_memberships um
    WHERE um.user_id = auth.uid()
    AND um.empresa_id = colaboradores.empresa_id
  )
);

-- Allow empresa members to read colaboradores of their empresa
CREATE POLICY "Membros da empresa podem ver colaboradores"
ON public.colaboradores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_memberships um
    WHERE um.user_id = auth.uid()
    AND um.empresa_id = colaboradores.empresa_id
  )
);