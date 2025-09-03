-- Corrigir políticas RLS para requests - permitir acesso para administradores e RH
DROP POLICY IF EXISTS "RH e Admin podem ver todas as solicitações" ON public.requests;
DROP POLICY IF EXISTS "RH e Admin podem atualizar solicitações" ON public.requests;

-- Nova política mais robusta para SELECT
CREATE POLICY "Allow RH and Admin to view requests" ON public.requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND (u.role IN ('rh', 'admin', 'administrador'))
  )
);

-- Nova política para UPDATE  
CREATE POLICY "Allow RH and Admin to update requests" ON public.requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND (u.role IN ('rh', 'admin', 'administrador'))
  )
);

-- Verificar e corrigir política de employees também
DROP POLICY IF EXISTS "RH pode ver colaboradores da sua empresa" ON public.employees;

CREATE POLICY "Allow RH and Admin to view employees" ON public.employees
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND (u.role IN ('rh', 'admin', 'administrador'))
  )
);