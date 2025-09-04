-- Add RLS policies for tickets table to allow corretora_admin access

-- Policy for corretora_admin to view all tickets
CREATE POLICY "Corretora admin pode ver todos os tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'corretora_admin'
  )
);

-- Policy for corretora_admin to update tickets
CREATE POLICY "Corretora admin pode atualizar tickets"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role = 'corretora_admin'
  )
);