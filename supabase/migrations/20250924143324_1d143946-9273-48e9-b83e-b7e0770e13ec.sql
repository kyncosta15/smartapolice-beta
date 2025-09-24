-- Criar política RLS mais simples e clara para tickets
DROP POLICY IF EXISTS "Usuários podem gerenciar tickets da sua empresa" ON public.tickets;

CREATE POLICY "Usuarios podem acessar tickets da empresa"
ON public.tickets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND e.id = tickets.empresa_id
  )
);