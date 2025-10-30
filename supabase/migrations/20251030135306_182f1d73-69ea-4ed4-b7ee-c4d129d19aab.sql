-- Criar política para clientes verem apólices pelo documento (CPF/CNPJ)
CREATE POLICY "Users can view policies by documento"
ON public.policies
FOR SELECT
TO authenticated
USING (
  documento IN (
    SELECT u.documento 
    FROM public.users u 
    WHERE u.id = auth.uid() AND u.documento IS NOT NULL
  )
);