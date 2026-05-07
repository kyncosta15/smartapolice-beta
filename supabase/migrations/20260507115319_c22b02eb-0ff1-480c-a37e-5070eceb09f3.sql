ALTER TABLE public.frota_veiculos ADD COLUMN IF NOT EXISTS current_responsible_contact TEXT;
UPDATE public.vehicle_finance SET type='A_VISTA' WHERE type='AVISTA';