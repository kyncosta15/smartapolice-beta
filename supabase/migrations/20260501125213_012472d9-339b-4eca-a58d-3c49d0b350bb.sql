-- Permitir que admins acessem o bucket consultoria-documentos sem precisar de membership
DROP POLICY IF EXISTS consultoria_storage_admin_all ON storage.objects;
CREATE POLICY consultoria_storage_admin_all
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'consultoria-documentos' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'consultoria-documentos' AND has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins criem/leiam consultoria_casos para qualquer empresa (sem checar premium)
-- As policies existentes já incluem has_role admin no OR — apenas garante que casos_member_all
-- não seja mais permissiva sem checar premium para clientes não admin.
DROP POLICY IF EXISTS consultoria_casos_member_all ON public.consultoria_casos;
DROP POLICY IF EXISTS consultoria_documentos_member_all ON public.consultoria_documentos;
DROP POLICY IF EXISTS consultoria_pareceres_member_all ON public.consultoria_pareceres;
DROP POLICY IF EXISTS consultoria_lacunas_member_all ON public.consultoria_lacunas;
DROP POLICY IF EXISTS consultoria_config_member_all ON public.consultoria_config;