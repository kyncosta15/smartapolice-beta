-- Criar política para permitir usuários verem empresas onde têm membership
CREATE POLICY "Usuários podem ver empresas onde têm membership" 
ON public.empresas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_memberships um 
    WHERE um.user_id = auth.uid() 
    AND um.empresa_id = empresas.id
  )
);