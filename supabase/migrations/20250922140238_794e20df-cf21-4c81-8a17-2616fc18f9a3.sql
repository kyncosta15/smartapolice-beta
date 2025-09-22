-- Fix remaining functions without proper search_path

-- Update before_delete_policy function
CREATE OR REPLACE FUNCTION public.before_delete_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Deletar coberturas relacionadas
    DELETE FROM public.coberturas WHERE policy_id = OLD.id;
    
    -- Deletar parcelas relacionadas
    DELETE FROM public.parcelas WHERE policy_id = OLD.id;
    
    -- Deletar installments relacionados
    DELETE FROM public.installments WHERE policy_id = OLD.id;
    
    RETURN OLD;
END;
$function$;

-- Update check_and_fix_policy_inconsistencies function
CREATE OR REPLACE FUNCTION public.check_and_fix_policy_inconsistencies()
RETURNS TABLE(issue_type text, policy_id uuid, fixed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    orphaned_record record;
BEGIN
    -- 1. Verificar e corrigir coberturas órfãs (sem apólice correspondente)
    FOR orphaned_record IN 
        SELECT c.id, c.policy_id 
        FROM public.coberturas c
        LEFT JOIN public.policies p ON c.policy_id = p.id
        WHERE p.id IS NULL AND c.policy_id IS NOT NULL
    LOOP
        DELETE FROM public.coberturas WHERE id = orphaned_record.id;
        issue_type := 'orphaned_cobertura';
        policy_id := orphaned_record.policy_id;
        fixed := true;
        RETURN NEXT;
    END LOOP;
    
    -- 2. Verificar e corrigir parcelas órfãs
    FOR orphaned_record IN 
        SELECT pa.id, pa.policy_id 
        FROM public.parcelas pa
        LEFT JOIN public.policies p ON pa.policy_id = p.id
        WHERE p.id IS NULL AND pa.policy_id IS NOT NULL
    LOOP
        DELETE FROM public.parcelas WHERE id = orphaned_record.id;
        issue_type := 'orphaned_parcela';
        policy_id := orphaned_record.policy_id;
        fixed := true;
        RETURN NEXT;
    END LOOP;
    
    -- 3. Verificar e corrigir installments órfãos
    FOR orphaned_record IN 
        SELECT i.id, i.policy_id 
        FROM public.installments i
        LEFT JOIN public.policies p ON i.policy_id = p.id
        WHERE p.id IS NULL AND i.policy_id IS NOT NULL
    LOOP
        DELETE FROM public.installments WHERE id = orphaned_record.id;
        issue_type := 'orphaned_installment';
        policy_id := orphaned_record.policy_id;
        fixed := true;
        RETURN NEXT;
    END LOOP;
    
    -- 4. Verificar apólices com referências a usuários inexistentes
    FOR orphaned_record IN 
        SELECT p.id, p.user_id
        FROM public.policies p
        LEFT JOIN public.users u ON p.user_id = u.id
        WHERE u.id IS NULL
    LOOP
        -- Aqui você pode decidir se quer deletar a apólice ou apenas registrar o problema
        -- DELETE FROM public.policies WHERE id = orphaned_record.id;
        issue_type := 'policy_with_missing_user';
        policy_id := orphaned_record.id;
        fixed := false; -- Não deletamos automaticamente, apenas reportamos
        RETURN NEXT;
    END LOOP;
    
    -- Se não encontrou problemas
    IF NOT FOUND THEN
        issue_type := 'no_issues_found';
        policy_id := NULL;
        fixed := true;
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$function$;

-- Update delete_policy_completely function
CREATE OR REPLACE FUNCTION public.delete_policy_completely(policy_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    policy_file_path text;
BEGIN
    -- Obter o caminho do arquivo da apólice para deletar do storage
    SELECT arquivo_url INTO policy_file_path FROM public.policies WHERE id = policy_id_param;
    
    -- 1. Deletar coberturas relacionadas à apólice
    DELETE FROM public.coberturas WHERE policy_id = policy_id_param;
    
    -- 2. Deletar parcelas relacionadas à apólice
    DELETE FROM public.parcelas WHERE policy_id = policy_id_param;
    
    -- 3. Deletar installments relacionados à apólice
    DELETE FROM public.installments WHERE policy_id = policy_id_param;
    
    -- 4. Deletar a apólice
    DELETE FROM public.policies WHERE id = policy_id_param;
    
    -- 5. Commit explícito para garantir que as alterações sejam persistidas
    COMMIT;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao deletar apólice: %', SQLERRM;
        RETURN false;
END;
$function$;