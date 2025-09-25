-- Permitir valores null na coluna expires_at para links permanentes
ALTER TABLE public.public_fleet_tokens 
ALTER COLUMN expires_at DROP NOT NULL;