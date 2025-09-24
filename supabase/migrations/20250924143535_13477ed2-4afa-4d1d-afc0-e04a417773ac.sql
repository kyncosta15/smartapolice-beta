-- Verificar e corrigir política RLS para tickets
-- A política atual pode estar com problema na verificação do auth.uid()

-- Remover política existente
DROP POLICY IF EXISTS "Usuários podem gerenciar tickets da sua empresa" ON tickets;

-- Criar uma política mais simples que funciona
CREATE POLICY "Usuários podem ver tickets da sua empresa"
ON public.tickets
FOR SELECT
TO authenticated
USING (
    empresa_id IN (
        SELECT e.id 
        FROM empresas e
        JOIN users u ON u.company = e.nome
        WHERE u.id = auth.uid()
    )
);

-- Política separada para INSERT/UPDATE/DELETE
CREATE POLICY "Usuários podem inserir tickets da sua empresa"
ON public.tickets
FOR INSERT
TO authenticated
WITH CHECK (
    empresa_id IN (
        SELECT e.id 
        FROM empresas e
        JOIN users u ON u.company = e.nome
        WHERE u.id = auth.uid()
        AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh', 'cliente')
    )
);

CREATE POLICY "Usuários podem atualizar tickets da sua empresa"
ON public.tickets
FOR UPDATE
TO authenticated
USING (
    empresa_id IN (
        SELECT e.id 
        FROM empresas e
        JOIN users u ON u.company = e.nome
        WHERE u.id = auth.uid()
    )
);

CREATE POLICY "Usuários podem deletar tickets da sua empresa"
ON public.tickets
FOR DELETE
TO authenticated
USING (
    empresa_id IN (
        SELECT e.id 
        FROM empresas e
        JOIN users u ON u.company = e.nome
        WHERE u.id = auth.uid()
        AND u.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    )
);