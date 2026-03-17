
-- Add realizada column to vehicle_maintenance_logs
ALTER TABLE public.vehicle_maintenance_logs ADD COLUMN IF NOT EXISTS realizada boolean NOT NULL DEFAULT false;

-- Drop old check constraint on type
ALTER TABLE public.vehicle_maintenance_logs DROP CONSTRAINT IF EXISTS vehicle_maintenance_logs_type_check;

-- Add new check constraint with expanded types
ALTER TABLE public.vehicle_maintenance_logs ADD CONSTRAINT vehicle_maintenance_logs_type_check 
  CHECK (type IN ('BATERIA','PNEU','REVISAO','REVISAO_COMPLETA','PREVENTIVA','CORRETIVA','TROCA_OLEO','TROCA_PNEUS','TROCA_FREIOS','TROCA_FILTROS','TROCA_BATERIA','OUTRA'));

-- Also update rules constraint
ALTER TABLE public.vehicle_maintenance_rules DROP CONSTRAINT IF EXISTS vehicle_maintenance_rules_type_check;
ALTER TABLE public.vehicle_maintenance_rules ADD CONSTRAINT vehicle_maintenance_rules_type_check 
  CHECK (type IN ('BATERIA','PNEU','REVISAO','REVISAO_COMPLETA','PREVENTIVA','CORRETIVA','TROCA_OLEO','TROCA_PNEUS','TROCA_FREIOS','TROCA_FILTROS','TROCA_BATERIA','OUTRA'));
