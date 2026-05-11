ALTER TABLE public.frota_veiculos
  ADD COLUMN IF NOT EXISTS revisao_proxima_km integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revisao_proxima_data date;