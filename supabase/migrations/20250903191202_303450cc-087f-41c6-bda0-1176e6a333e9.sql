-- Primeiro vamos dropar todas as políticas existentes da tabela requests
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'requests' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.requests';
    END LOOP;
END $$;

-- Recriar políticas simplificadas e funcionais
CREATE POLICY "Admin can view all requests" ON public.requests
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

CREATE POLICY "Admin can update requests" ON public.requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('administrador', 'admin', 'rh')
  )
);

-- Manter política de INSERT público
CREATE POLICY "Allow public insert on requests" ON public.requests
FOR INSERT WITH CHECK (true);

-- Manter política de UPDATE público 
CREATE POLICY "Allow public update on requests" ON public.requests
FOR UPDATE USING (true);