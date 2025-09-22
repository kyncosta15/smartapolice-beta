-- Fix the last remaining functions without proper search_path

-- Update delete_user_and_related_data function
CREATE OR REPLACE FUNCTION public.delete_user_and_related_data(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- 1. Deletar coberturas relacionadas às políticas do usuário
    DELETE FROM public.coberturas
    WHERE policy_id IN (
        SELECT id FROM public.policies WHERE user_id = user_id_param
    );
    
    -- 2. Deletar parcelas relacionadas às políticas do usuário
    DELETE FROM public.parcelas
    WHERE policy_id IN (
        SELECT id FROM public.policies WHERE user_id = user_id_param
    );
    
    -- 3. Deletar installments relacionados às políticas do usuário
    DELETE FROM public.installments
    WHERE policy_id IN (
        SELECT id FROM public.policies WHERE user_id = user_id_param
    ) OR user_id = user_id_param;
    
    -- 4. Deletar monthly_projections do usuário
    DELETE FROM public.monthly_projections
    WHERE user_id = user_id_param;
    
    -- 5. Deletar dashboard_exports do usuário
    DELETE FROM public.dashboard_exports
    WHERE user_id = user_id_param;
    
    -- 6. Deletar políticas do usuário
    DELETE FROM public.policies
    WHERE user_id = user_id_param OR responsavel_user_id = user_id_param;
    
    -- 7. Deletar arquivos de storage relacionados ao usuário
    DELETE FROM storage.objects
    WHERE (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = user_id_param::text)
       OR (bucket_id = 'policies' AND (storage.foldername(name))[1] = user_id_param::text);
    
    -- 8. Finalmente, deletar o usuário
    DELETE FROM public.users
    WHERE id = user_id_param;
    
    RETURN true;
END;
$function$;

-- Update delete_user_completely function
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    policy_record record;
BEGIN
    -- 1. Primeiro, deletar cada apólice individualmente para garantir limpeza completa
    FOR policy_record IN 
        SELECT id FROM public.policies WHERE user_id = user_id_param OR responsavel_user_id = user_id_param
    LOOP
        PERFORM public.delete_policy_completely(policy_record.id);
    END LOOP;
    
    -- 2. Deletar monthly_projections do usuário
    DELETE FROM public.monthly_projections WHERE user_id = user_id_param;
    
    -- 3. Deletar dashboard_exports do usuário
    DELETE FROM public.dashboard_exports WHERE user_id = user_id_param;
    
    -- 4. Deletar quaisquer installments restantes do usuário
    DELETE FROM public.installments WHERE user_id = user_id_param;
    
    -- 5. Deletar arquivos de storage relacionados ao usuário
    DELETE FROM storage.objects
    WHERE (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = user_id_param::text)
       OR (bucket_id = 'policies' AND (storage.foldername(name))[1] = user_id_param::text);
    
    -- 6. Verificar se ainda existem referências ao usuário
    PERFORM public.check_and_fix_policy_inconsistencies();
    
    -- 7. Finalmente, deletar o usuário
    DELETE FROM public.users WHERE id = user_id_param;
    
    -- 8. Commit explícito para garantir que as alterações sejam persistidas
    COMMIT;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao deletar usuário: %', SQLERRM;
        RETURN false;
END;
$function$;

-- Update test_file_access function
CREATE OR REPLACE FUNCTION public.test_file_access(file_path text)
RETURNS TABLE(can_access boolean, user_id text, file_owner text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ((auth.uid())::text = (storage.foldername(file_path))[1]) AS can_access,
    (auth.uid())::text AS user_id,
    (storage.foldername(file_path))[1] AS file_owner,
    CASE
      WHEN ((auth.uid())::text = (storage.foldername(file_path))[1]) THEN 'Acesso permitido'
      ELSE 'Acesso negado: usuário não é o proprietário do arquivo'
    END AS reason;
END;
$function$;