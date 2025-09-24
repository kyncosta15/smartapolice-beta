-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION update_fleet_change_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;