-- Drop the conflicting policies
DROP POLICY IF EXISTS "frota_veiculos_select_isolated" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_update_isolated" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_delete_isolated" ON public.frota_veiculos;
DROP POLICY IF EXISTS "frota_veiculos_insert_isolated" ON public.frota_veiculos;

-- Create consistent company-based policies
CREATE POLICY "frota_veiculos_select_company" ON public.frota_veiculos
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id()
);

CREATE POLICY "frota_veiculos_insert_company" ON public.frota_veiculos
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id()
);

CREATE POLICY "frota_veiculos_update_company" ON public.frota_veiculos
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id()
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id()
);

CREATE POLICY "frota_veiculos_delete_company" ON public.frota_veiculos
FOR DELETE USING (
  auth.uid() IS NOT NULL AND 
  empresa_id = current_empresa_id()
);