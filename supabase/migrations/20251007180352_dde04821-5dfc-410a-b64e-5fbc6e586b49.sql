-- ========================================
-- RLS POLICIES FOR ADMIN BYPASS
-- Permite que admins vejam todos os dados de todos os tenants
-- ========================================

-- Helper function para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- ========================================
-- POLICIES PARA frota_veiculos
-- ========================================

-- Admin pode ver todos os veículos
DROP POLICY IF EXISTS "admin_read_all_vehicles" ON public.frota_veiculos;
CREATE POLICY "admin_read_all_vehicles"
ON public.frota_veiculos FOR SELECT
USING (public.is_super_admin());

-- ========================================
-- POLICIES PARA tickets (sinistros e assistências)
-- ========================================

-- Admin pode ver todos os tickets
DROP POLICY IF EXISTS "admin_read_all_tickets" ON public.tickets;
CREATE POLICY "admin_read_all_tickets"
ON public.tickets FOR SELECT
USING (public.is_super_admin());

-- ========================================
-- POLICIES PARA apolices_beneficios
-- ========================================

-- Admin pode ver todas as apólices
DROP POLICY IF EXISTS "admin_read_all_apolices" ON public.apolices_beneficios;
CREATE POLICY "admin_read_all_apolices"
ON public.apolices_beneficios FOR SELECT
USING (public.is_super_admin());

-- ========================================
-- POLICIES PARA empresas
-- ========================================

-- Admin já tem política que permite ver todas empresas, manter como está

-- ========================================
-- POLICIES PARA insurance_approval_requests
-- ========================================

-- Admin pode ver todas as aprovações
DROP POLICY IF EXISTS "admin_read_all_approvals" ON public.insurance_approval_requests;
CREATE POLICY "admin_read_all_approvals"
ON public.insurance_approval_requests FOR SELECT
USING (public.is_super_admin());

-- Admin pode atualizar aprovações
DROP POLICY IF EXISTS "admin_update_approvals" ON public.insurance_approval_requests;
CREATE POLICY "admin_update_approvals"
ON public.insurance_approval_requests FOR UPDATE
USING (public.is_super_admin());

COMMENT ON FUNCTION public.is_super_admin IS 'Verifica se o usuário atual é um super admin que pode ver todos os tenants';