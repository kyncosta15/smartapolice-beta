-- Função para garantir que a empresa padrão existe
CREATE OR REPLACE FUNCTION public.ensure_default_empresa()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  default_empresa_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  empresa_existente record;
BEGIN
  -- Verificar se a empresa padrão já existe
  SELECT id INTO empresa_existente
  FROM public.empresas
  WHERE id = default_empresa_id;

  -- Se não existe, criar
  IF empresa_existente.id IS NULL THEN
    INSERT INTO public.empresas (
      id,
      nome,
      slug,
      created_at,
      updated_at
    ) VALUES (
      default_empresa_id,
      'Clientes Individuais',
      'clientes-individuais',
      now(),
      now()
    );
  END IF;

  RETURN default_empresa_id;
END;
$function$;