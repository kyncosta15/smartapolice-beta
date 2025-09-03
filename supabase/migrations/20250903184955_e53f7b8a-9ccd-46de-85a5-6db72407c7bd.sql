-- Corrigir funções com search_path mutable (security warnings)
-- Atualizar funções existentes para ter search_path correto

CREATE OR REPLACE FUNCTION public.set_extraction_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.created_by_extraction = true AND OLD.created_by_extraction IS DISTINCT FROM true THEN
    NEW.extraction_timestamp = now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero_ticket = 'SB' || LPAD(EXTRACT(year FROM now())::text, 4, '0') || 
                      LPAD(EXTRACT(month FROM now())::text, 2, '0') || 
                      LPAD(nextval('ticket_sequence')::text, 6, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_protocolo_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero_protocolo = 'SB' || LPAD(EXTRACT(year FROM now())::text, 4, '0') || 
                         LPAD(EXTRACT(month FROM now())::text, 2, '0') || 
                         LPAD(nextval('ticket_sequence')::text, 6, '0');
  NEW.data_protocolo = now();
  RETURN NEW;
END;
$function$;