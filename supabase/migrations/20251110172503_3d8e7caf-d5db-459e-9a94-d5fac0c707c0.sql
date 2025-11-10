-- Habilitar RLS na tabela fleet_change_requests
ALTER TABLE public.fleet_change_requests ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas solicitações da sua empresa
CREATE POLICY "Usuários podem ver solicitações da sua empresa"
ON public.fleet_change_requests
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.user_memberships 
    WHERE user_id = auth.uid()
  )
);

-- Política para INSERT: usuários podem criar solicitações para sua empresa
CREATE POLICY "Usuários podem criar solicitações para sua empresa"
ON public.fleet_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.user_memberships 
    WHERE user_id = auth.uid()
  )
);

-- Política para UPDATE: usuários podem atualizar solicitações da sua empresa
CREATE POLICY "Usuários podem atualizar solicitações da sua empresa"
ON public.fleet_change_requests
FOR UPDATE
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.user_memberships 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.user_memberships 
    WHERE user_id = auth.uid()
  )
);

-- Política para DELETE: usuários podem deletar solicitações da sua empresa
CREATE POLICY "Usuários podem deletar solicitações da sua empresa"
ON public.fleet_change_requests
FOR DELETE
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.user_memberships 
    WHERE user_id = auth.uid()
  )
);