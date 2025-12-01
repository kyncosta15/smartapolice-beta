-- Adicionar política para INSERT permitindo usuários autenticados criarem agendamentos para sua empresa
CREATE POLICY "Usuários podem criar agendamentos para sua empresa"
ON public.report_schedules
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_memberships um
    WHERE um.user_id = auth.uid()
    AND um.empresa_id = report_schedules.empresa_id
  )
);

-- Adicionar política para UPDATE permitindo usuários atualizarem agendamentos que criaram
CREATE POLICY "Usuários podem atualizar agendamentos que criaram"
ON public.report_schedules
FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin']::text[])
  )
);

-- Adicionar política para DELETE permitindo usuários deletarem agendamentos que criaram
CREATE POLICY "Usuários podem deletar agendamentos que criaram"
ON public.report_schedules
FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin']::text[])
  )
);

-- Melhorar política SELECT para incluir memberships
CREATE POLICY "Membros da empresa podem ver agendamentos"
ON public.report_schedules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_memberships um
    WHERE um.user_id = auth.uid()
    AND um.empresa_id = report_schedules.empresa_id
  )
);