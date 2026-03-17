
-- Create vehicle_assignment_history table
CREATE TABLE public.vehicle_assignment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  responsible_name TEXT NOT NULL,
  responsible_contact TEXT,
  worksite_name TEXT NOT NULL,
  worksite_code TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add current assignment fields to frota_veiculos
ALTER TABLE public.frota_veiculos
  ADD COLUMN IF NOT EXISTS current_responsible_name TEXT,
  ADD COLUMN IF NOT EXISTS current_worksite_name TEXT,
  ADD COLUMN IF NOT EXISTS current_worksite_start_date DATE,
  ADD COLUMN IF NOT EXISTS has_assignment_info BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.vehicle_assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can access assignment history for vehicles in their company
CREATE POLICY "Users can view assignment history for their company vehicles"
  ON public.vehicle_assignment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.frota_veiculos v
      JOIN public.user_memberships um ON um.empresa_id = v.empresa_id
      WHERE v.id = vehicle_assignment_history.vehicle_id
      AND um.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assignment history for their company vehicles"
  ON public.vehicle_assignment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.frota_veiculos v
      JOIN public.user_memberships um ON um.empresa_id = v.empresa_id
      WHERE v.id = vehicle_assignment_history.vehicle_id
      AND um.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignment history for their company vehicles"
  ON public.vehicle_assignment_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.frota_veiculos v
      JOIN public.user_memberships um ON um.empresa_id = v.empresa_id
      WHERE v.id = vehicle_assignment_history.vehicle_id
      AND um.user_id = auth.uid()
    )
  );

-- Create index for fast lookups
CREATE INDEX idx_vehicle_assignment_history_vehicle_id ON public.vehicle_assignment_history(vehicle_id);
CREATE INDEX idx_vehicle_assignment_history_end_date ON public.vehicle_assignment_history(vehicle_id, end_date) WHERE end_date IS NULL;
