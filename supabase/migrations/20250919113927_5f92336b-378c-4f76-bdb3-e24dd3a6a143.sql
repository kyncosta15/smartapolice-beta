-- Função para detectar e corrigir status "outros" para "sem_seguro"
CREATE OR REPLACE FUNCTION public.fix_frota_status_outros()
RETURNS TABLE(
  veiculos_atualizados integer,
  placas_alteradas text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
  v_placas text[];
BEGIN
  -- Buscar placas dos veículos com status "outros" antes da atualização
  SELECT array_agg(placa) INTO v_placas
  FROM frota_veiculos 
  WHERE LOWER(status_seguro) = 'outros' OR status_seguro = 'outros';
  
  -- Atualizar status de "outros" para "sem_seguro"
  UPDATE frota_veiculos 
  SET 
    status_seguro = 'sem_seguro',
    updated_at = now()
  WHERE LOWER(status_seguro) = 'outros' OR status_seguro = 'outros';
  
  -- Contar quantos registros foram atualizados
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Retornar resultado
  RETURN QUERY SELECT v_count, COALESCE(v_placas, ARRAY[]::text[]);
END;
$$;

-- Função para executar a correção automaticamente ao detectar inconsistências
CREATE OR REPLACE FUNCTION public.auto_fix_frota_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result record;
  v_current_user_id uuid;
  v_user_role text;
BEGIN
  -- Verificar se o usuário está autenticado e tem permissão
  SELECT id INTO v_current_user_id FROM auth.users WHERE id = auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;
  
  -- Verificar role do usuário
  SELECT role INTO v_user_role FROM users WHERE id = v_current_user_id;
  
  IF v_user_role NOT IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sem permissão para executar correções'
    );
  END IF;
  
  -- Executar correção
  SELECT * INTO v_result FROM fix_frota_status_outros();
  
  RETURN jsonb_build_object(
    'success', true,
    'veiculos_atualizados', v_result.veiculos_atualizados,
    'placas_alteradas', v_result.placas_alteradas,
    'message', 
    CASE 
      WHEN v_result.veiculos_atualizados > 0 THEN 
        format('Corrigidos %s veículos com status "Outros" para "Sem seguro"', v_result.veiculos_atualizados)
      ELSE 
        'Nenhum veículo encontrado com status "Outros"'
    END
  );
END;
$$;