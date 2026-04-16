-- Speed up fleet documents queries
CREATE INDEX IF NOT EXISTS idx_frota_documentos_veiculo_id ON public.frota_documentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_fleet_change_requests_placa ON public.fleet_change_requests(placa) WHERE placa IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fleet_change_requests_chassi ON public.fleet_change_requests(chassi) WHERE chassi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fleet_change_requests_status_empresa ON public.fleet_change_requests(status, empresa_id);