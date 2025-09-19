-- Função para corrigir veículos com categoria "outros" para status "sem_seguro"
CREATE OR REPLACE FUNCTION fix_categoria_outros_to_sem_seguro()
RETURNS TABLE(
  success boolean,
  veiculos_atualizados integer,
  placas_alteradas text[],
  message text,
  error text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_count integer;
  placas_array text[];
BEGIN
  -- Verificar se o usuário tem permissão
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
  ) THEN
    RETURN QUERY SELECT false, 0, ARRAY[]::text[], 'Usuário não tem permissão para executar esta ação', 'Permissão negada';
    RETURN;
  END IF;

  -- Buscar placas dos veículos que serão alterados
  SELECT ARRAY(
    SELECT placa 
    FROM frota_veiculos 
    WHERE categoria = 'outros' 
    AND status_seguro != 'sem_seguro'
  ) INTO placas_array;

  -- Atualizar status_seguro dos veículos com categoria "outros"
  UPDATE frota_veiculos 
  SET 
    status_seguro = 'sem_seguro',
    updated_at = now()
  WHERE categoria = 'outros' 
  AND status_seguro != 'sem_seguro';
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  IF update_count > 0 THEN
    RETURN QUERY SELECT 
      true, 
      update_count, 
      placas_array,
      format('✅ %s veículos com categoria "Outros" foram alterados para status "Sem Seguro"', update_count),
      ''::text;
  ELSE
    RETURN QUERY SELECT 
      true, 
      0, 
      ARRAY[]::text[], 
      'ℹ️ Nenhum veículo com categoria "Outros" foi encontrado para alteração',
      ''::text;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false, 
      0, 
      ARRAY[]::text[], 
      'Erro ao executar correção',
      SQLERRM;
END;
$$;