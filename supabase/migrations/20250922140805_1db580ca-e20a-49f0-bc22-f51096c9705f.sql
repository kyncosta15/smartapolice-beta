-- Fix the final remaining trigger functions without proper search_path

-- Update update_coberturas_updated_at function
CREATE OR REPLACE FUNCTION public.update_coberturas_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_dashboard_exports_updated_at function
CREATE OR REPLACE FUNCTION public.update_dashboard_exports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update update_monthly_projections_updated_at function
CREATE OR REPLACE FUNCTION public.update_monthly_projections_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;