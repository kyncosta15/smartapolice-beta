-- Temporariamente dar permissões explícitas para testar
GRANT INSERT, SELECT, UPDATE, DELETE ON public.frota_veiculos TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.frota_responsaveis TO authenticated;  
GRANT INSERT, SELECT, UPDATE, DELETE ON public.frota_pagamentos TO authenticated;
GRANT SELECT ON public.empresas TO authenticated;
GRANT SELECT ON public.users TO authenticated;