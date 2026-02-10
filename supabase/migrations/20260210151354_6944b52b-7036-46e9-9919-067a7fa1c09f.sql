
-- Update before_delete_policy trigger to also clean apolice_parcelas
CREATE OR REPLACE FUNCTION public.before_delete_policy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.coberturas WHERE policy_id = OLD.id;
    DELETE FROM public.parcelas WHERE policy_id = OLD.id;
    DELETE FROM public.installments WHERE policy_id = OLD.id;
    DELETE FROM public.apolice_parcelas WHERE apolice_id = OLD.id;
    RETURN OLD;
END;
$function$;

-- Update delete_policy_completely to also clean apolice_parcelas
CREATE OR REPLACE FUNCTION public.delete_policy_completely(policy_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    policy_file_path text;
BEGIN
    SELECT arquivo_url INTO policy_file_path FROM public.policies WHERE id = policy_id_param;
    DELETE FROM public.coberturas WHERE policy_id = policy_id_param;
    DELETE FROM public.parcelas WHERE policy_id = policy_id_param;
    DELETE FROM public.installments WHERE policy_id = policy_id_param;
    DELETE FROM public.apolice_parcelas WHERE apolice_id = policy_id_param;
    DELETE FROM public.policies WHERE id = policy_id_param;
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao deletar apólice: %', SQLERRM;
        RETURN false;
END;
$function$;
