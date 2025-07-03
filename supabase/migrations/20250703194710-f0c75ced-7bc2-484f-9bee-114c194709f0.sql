-- Criar política para administradores poderem ver todas as apólices
CREATE POLICY "Admins can view all policies" 
ON public.policies 
FOR SELECT 
TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrador'
);

-- Criar política para administradores poderem atualizar todas as apólices  
CREATE POLICY "Admins can update all policies" 
ON public.policies 
FOR UPDATE 
TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrador'
);

-- Criar política para administradores poderem deletar todas as apólices
CREATE POLICY "Admins can delete all policies" 
ON public.policies 
FOR DELETE 
TO authenticated 
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'administrador'
);