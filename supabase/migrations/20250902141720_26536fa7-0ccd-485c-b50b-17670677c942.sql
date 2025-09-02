-- Corrigir funções para ter search_path definido
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero_ticket = 'SB' || LPAD(EXTRACT(year FROM now())::text, 4, '0') || 
                      LPAD(EXTRACT(month FROM now())::text, 2, '0') || 
                      LPAD(nextval('ticket_sequence')::text, 6, '0');
  RETURN NEW;
END;
$$;

-- Adicionar políticas RLS faltantes para empresas
CREATE POLICY "RH pode inserir sua própria empresa" 
ON public.empresas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'rh' OR users.role = 'admin')
    AND users.company = empresas.nome
  )
);

CREATE POLICY "RH pode atualizar sua própria empresa" 
ON public.empresas 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'rh' OR users.role = 'admin')
    AND users.company = empresas.nome
  )
);

-- Adicionar políticas RLS faltantes para dependentes
CREATE POLICY "RH pode inserir dependentes da sua empresa" 
ON public.dependentes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.colaboradores c
    JOIN public.empresas e ON c.empresa_id = e.id
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND c.id = dependentes.colaborador_id
  )
);

CREATE POLICY "RH pode atualizar dependentes da sua empresa" 
ON public.dependentes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.colaboradores c
    JOIN public.empresas e ON c.empresa_id = e.id
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND c.id = dependentes.colaborador_id
  )
);

-- Adicionar políticas RLS faltantes para tickets
CREATE POLICY "RH pode inserir tickets da sua empresa" 
ON public.tickets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.empresas e
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = tickets.empresa_id
  )
);

CREATE POLICY "RH pode atualizar tickets da sua empresa" 
ON public.tickets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = tickets.empresa_id
  )
);

-- Adicionar políticas RLS para histórico
CREATE POLICY "RH pode ver histórico da sua empresa" 
ON public.colaboradores_historico 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.colaboradores c
    JOIN public.empresas e ON c.empresa_id = e.id
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND c.id = colaboradores_historico.colaborador_id
  )
);

CREATE POLICY "RH pode inserir histórico da sua empresa" 
ON public.colaboradores_historico 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.colaboradores c
    JOIN public.empresas e ON c.empresa_id = e.id
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND c.id = colaboradores_historico.colaborador_id
  )
);