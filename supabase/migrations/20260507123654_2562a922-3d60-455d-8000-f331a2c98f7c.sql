-- USERS
DROP POLICY IF EXISTS "Authenticated users can read basic user info for functions" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read user info" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read users" ON public.users;

-- FROTA
DROP POLICY IF EXISTS "frota_veiculos_select_policy" ON public.frota_veiculos;
CREATE POLICY "frota_veiculos_select_policy" ON public.frota_veiculos
FOR SELECT TO authenticated
USING (
  empresa_id = public.current_empresa_id()
  OR public.user_belongs_to_empresa(empresa_id)
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Usuários autenticados podem ver pagamentos" ON public.frota_pagamentos;
CREATE POLICY "frota_pagamentos_select_scoped" ON public.frota_pagamentos
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.frota_veiculos v WHERE v.id = frota_pagamentos.veiculo_id
  AND (public.user_belongs_to_empresa(v.empresa_id) OR public.has_role(auth.uid(),'admin'))));

DROP POLICY IF EXISTS "frota_documentos_select_policy" ON public.frota_documentos;
CREATE POLICY "frota_documentos_select_scoped" ON public.frota_documentos
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.frota_veiculos v WHERE v.id = frota_documentos.veiculo_id
  AND (public.user_belongs_to_empresa(v.empresa_id) OR public.has_role(auth.uid(),'admin'))));

DROP POLICY IF EXISTS "Usuários autenticados podem ver responsáveis" ON public.frota_responsaveis;
CREATE POLICY "frota_responsaveis_select_scoped" ON public.frota_responsaveis
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.frota_veiculos v WHERE v.id = frota_responsaveis.veiculo_id
  AND (public.user_belongs_to_empresa(v.empresa_id) OR public.has_role(auth.uid(),'admin'))));

-- COLABORADOR DOCUMENTOS
DROP POLICY IF EXISTS "Authenticated users can manage documentos" ON public.colaborador_documentos;
DROP POLICY IF EXISTS "Authenticated users can read documentos" ON public.colaborador_documentos;
DROP POLICY IF EXISTS "Authenticated users can insert documentos" ON public.colaborador_documentos;
DROP POLICY IF EXISTS "Authenticated users can update documentos" ON public.colaborador_documentos;
DROP POLICY IF EXISTS "Authenticated users can delete documentos" ON public.colaborador_documentos;

CREATE POLICY "colaborador_documentos_scoped_select" ON public.colaborador_documentos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_documentos.colaborador_id
  AND (public.user_belongs_to_empresa(c.empresa_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "colaborador_documentos_scoped_insert" ON public.colaborador_documentos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_documentos.colaborador_id
  AND (public.user_belongs_to_empresa(c.empresa_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "colaborador_documentos_scoped_update" ON public.colaborador_documentos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_documentos.colaborador_id
  AND (public.user_belongs_to_empresa(c.empresa_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "colaborador_documentos_scoped_delete" ON public.colaborador_documentos FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_documentos.colaborador_id
  AND (public.user_belongs_to_empresa(c.empresa_id) OR public.has_role(auth.uid(),'admin'))));

-- COLABORADOR SUBMISSOES
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.colaborador_submissoes;
DROP POLICY IF EXISTS "Permitir leitura para usuarios autenticados" ON public.colaborador_submissoes;
CREATE POLICY "colaborador_submissoes_admin_select" ON public.colaborador_submissoes
FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- USER MEMBERSHIPS
DROP POLICY IF EXISTS "user_memberships_own" ON public.user_memberships;
CREATE POLICY "user_memberships_select_own" ON public.user_memberships
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_memberships_admin_manage" ON public.user_memberships
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REQUESTS
DROP POLICY IF EXISTS "Allow public insert on requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public update on requests" ON public.requests;

-- IMPORT JOBS
DROP POLICY IF EXISTS "Service can manage all import jobs" ON public.import_jobs;
CREATE POLICY "import_jobs_admin_only" ON public.import_jobs FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- VEICULO FIELD SOURCES
DROP POLICY IF EXISTS "Service can manage all field sources" ON public.veiculo_field_sources;
CREATE POLICY "veiculo_field_sources_scoped" ON public.veiculo_field_sources FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = veiculo_field_sources.veiculo_id AND public.user_belongs_to_empresa(v.empresa_id)))
WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = veiculo_field_sources.veiculo_id AND public.user_belongs_to_empresa(v.empresa_id)));

-- PUBLIC FLEET TOKENS
DROP POLICY IF EXISTS "Allow public token validation" ON public.public_fleet_tokens;
CREATE POLICY "public_fleet_tokens_admin_read" ON public.public_fleet_tokens
FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR created_by = auth.uid());

-- ENDOSSO PARCELAS — escopo via user_id da apólice
DROP POLICY IF EXISTS "Users can view endosso parcelas" ON public.endosso_parcelas;
DROP POLICY IF EXISTS "Users can insert endosso parcelas" ON public.endosso_parcelas;
DROP POLICY IF EXISTS "Users can update endosso parcelas" ON public.endosso_parcelas;
DROP POLICY IF EXISTS "Users can delete endosso parcelas" ON public.endosso_parcelas;

CREATE POLICY "endosso_parcelas_scoped_all" ON public.endosso_parcelas FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.policy_documents pd
    JOIN public.policies p ON p.id = pd.policy_id
    WHERE pd.id = endosso_parcelas.endosso_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.policy_documents pd
    JOIN public.policies p ON p.id = pd.policy_id
    WHERE pd.id = endosso_parcelas.endosso_id AND p.user_id = auth.uid()
  )
);

-- THEFT RISK REFERENCE
DROP POLICY IF EXISTS "Admins can manage theft risk reference" ON public.theft_risk_reference;
DROP POLICY IF EXISTS "Admins can update theft risk reference" ON public.theft_risk_reference;
DROP POLICY IF EXISTS "Admins can delete theft risk reference" ON public.theft_risk_reference;
CREATE POLICY "theft_risk_admin_insert" ON public.theft_risk_reference FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "theft_risk_admin_update" ON public.theft_risk_reference FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "theft_risk_admin_delete" ON public.theft_risk_reference FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

-- POLICY AUDIT
DROP POLICY IF EXISTS "System can insert audit records" ON public.policy_audit;
CREATE POLICY "policy_audit_authenticated_insert" ON public.policy_audit
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- VEHICLE MAINTENANCE
DROP POLICY IF EXISTS "Users can manage maintenance logs" ON public.vehicle_maintenance_logs;
CREATE POLICY "vehicle_maintenance_logs_scoped" ON public.vehicle_maintenance_logs FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = vehicle_maintenance_logs.vehicle_id AND public.user_belongs_to_empresa(v.empresa_id)))
WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = vehicle_maintenance_logs.vehicle_id AND public.user_belongs_to_empresa(v.empresa_id)));

DROP POLICY IF EXISTS "Users can manage maintenance rules" ON public.vehicle_maintenance_rules;
CREATE POLICY "vehicle_maintenance_rules_scoped" ON public.vehicle_maintenance_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = vehicle_maintenance_rules.vehicle_id AND public.user_belongs_to_empresa(v.empresa_id)))
WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.frota_veiculos v
  WHERE v.id = vehicle_maintenance_rules.vehicle_id AND public.user_belongs_to_empresa(v.empresa_id)));

-- STORAGE chat-attachments
DROP POLICY IF EXISTS "Permitir upload público de arquivos de chat" ON storage.objects;
CREATE POLICY "chat_attachments_authenticated_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');
