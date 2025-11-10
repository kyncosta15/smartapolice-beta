-- Remover políticas antigas que estão conflitando
DROP POLICY IF EXISTS "fcr_select_own_company" ON public.fleet_change_requests;
DROP POLICY IF EXISTS "fcr_insert_own_company" ON public.fleet_change_requests;
DROP POLICY IF EXISTS "fcr_update_own_company" ON public.fleet_change_requests;
DROP POLICY IF EXISTS "fcr_admin_all" ON public.fleet_change_requests;

-- Manter apenas as novas políticas baseadas em user_memberships que já foram criadas
-- (Usuários podem ver solicitações da sua empresa, Usuários podem criar solicitações para sua empresa, etc.)