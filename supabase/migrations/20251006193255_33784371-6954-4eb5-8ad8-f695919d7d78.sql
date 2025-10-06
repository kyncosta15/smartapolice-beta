-- 1. Adicionar campo is_admin na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);

-- 2. Criar funções auxiliares para checagem de admin e empresa atual
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Função para pegar empresa atual (usa default_empresa_id do profile ou primeira membership)
CREATE OR REPLACE FUNCTION public.get_current_empresa()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT default_empresa_id FROM public.user_profiles WHERE id = auth.uid()),
    (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid() LIMIT 1)
  );
$$;

-- 3. Criar tabela de solicitações de aprovação para mudança de status de seguro
CREATE TABLE IF NOT EXISTS public.insurance_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  veiculo_id UUID NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_status TEXT NOT NULL,
  requested_status TEXT NOT NULL,
  motivo TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID NULL REFERENCES auth.users(id),
  decision_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_empresa ON public.insurance_approval_requests(empresa_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.insurance_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_veiculo ON public.insurance_approval_requests(veiculo_id);

-- 4. Habilitar RLS na tabela de solicitações
ALTER TABLE public.insurance_approval_requests ENABLE ROW LEVEL SECURITY;

-- Admin vê e decide tudo
DROP POLICY IF EXISTS "admin_all_requests" ON public.insurance_approval_requests;
CREATE POLICY "admin_all_requests"
ON public.insurance_approval_requests
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Usuário cria solicitações da sua empresa
DROP POLICY IF EXISTS "tenant_create_requests" ON public.insurance_approval_requests;
CREATE POLICY "tenant_create_requests"
ON public.insurance_approval_requests
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id = public.get_current_empresa() 
  AND requested_by = auth.uid()
);

-- Usuário vê solicitações da sua empresa
DROP POLICY IF EXISTS "tenant_read_requests" ON public.insurance_approval_requests;
CREATE POLICY "tenant_read_requests"
ON public.insurance_approval_requests
FOR SELECT
TO authenticated
USING (empresa_id = public.get_current_empresa());

-- 5. Adicionar policy de admin para frota_veiculos (vê tudo)
DROP POLICY IF EXISTS "admin_all_veiculos" ON public.frota_veiculos;
CREATE POLICY "admin_all_veiculos"
ON public.frota_veiculos
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. Adicionar policy de admin para policies (vê tudo)
DROP POLICY IF EXISTS "admin_all_policies" ON public.policies;
CREATE POLICY "admin_all_policies"
ON public.policies
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. RPC para aprovar solicitação
CREATE OR REPLACE FUNCTION public.approve_insurance_request(
  p_request_id UUID,
  p_decision_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações.';
  END IF;

  -- Buscar solicitação pendente com lock
  SELECT * INTO r 
  FROM public.insurance_approval_requests 
  WHERE id = p_request_id AND status = 'pending' 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já foi decidida.';
  END IF;

  -- Atualizar status do veículo
  UPDATE public.frota_veiculos
  SET status_seguro = r.requested_status,
      updated_at = now()
  WHERE id = r.veiculo_id;

  -- Atualizar solicitação como aprovada
  UPDATE public.insurance_approval_requests
  SET status = 'approved',
      decided_by = auth.uid(),
      decided_at = now(),
      decision_note = p_decision_note
  WHERE id = p_request_id;

  RAISE NOTICE 'Solicitação % aprovada com sucesso.', p_request_id;
END;
$$;

-- 8. RPC para rejeitar solicitação
CREATE OR REPLACE FUNCTION public.reject_insurance_request(
  p_request_id UUID,
  p_decision_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar solicitações.';
  END IF;

  -- Buscar solicitação pendente com lock
  SELECT * INTO r 
  FROM public.insurance_approval_requests 
  WHERE id = p_request_id AND status = 'pending' 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já foi decidida.';
  END IF;

  -- Atualizar solicitação como rejeitada
  UPDATE public.insurance_approval_requests
  SET status = 'rejected',
      decided_by = auth.uid(),
      decided_at = now(),
      decision_note = p_decision_note
  WHERE id = p_request_id;

  RAISE NOTICE 'Solicitação % rejeitada.', p_request_id;
END;
$$;

-- 9. Comentários nas tabelas e funções
COMMENT ON TABLE public.insurance_approval_requests IS 'Solicitações de aprovação para mudança de status de seguro de veículos';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário autenticado é administrador';
COMMENT ON FUNCTION public.get_current_empresa() IS 'Retorna a empresa atual do usuário autenticado';
COMMENT ON FUNCTION public.approve_insurance_request IS 'Aprova uma solicitação de mudança de status de seguro (apenas admin)';
COMMENT ON FUNCTION public.reject_insurance_request IS 'Rejeita uma solicitação de mudança de status de seguro (apenas admin)';