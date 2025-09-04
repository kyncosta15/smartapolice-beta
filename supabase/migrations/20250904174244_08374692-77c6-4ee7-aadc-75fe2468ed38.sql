-- Verificar e corrigir políticas RLS para tickets
-- Permitir que corretora_admin crie e gerencie tickets
DROP POLICY IF EXISTS "RH pode gerenciar tickets" ON public.tickets;

CREATE POLICY "Admin pode gerenciar tickets" 
ON public.tickets 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('corretora_admin', 'admin', 'administrador')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('corretora_admin', 'admin', 'administrador')
));

-- Verificar se a tabela tickets tem RLS habilitada
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;