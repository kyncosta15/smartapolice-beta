-- Corrigir funções com search_path para atender aos requisitos de segurança
CREATE OR REPLACE FUNCTION public.generate_file_hash(file_content BYTEA)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(file_content, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_policy_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields TEXT[] := '{}';
  field_name TEXT;
  version_num INTEGER;
BEGIN
  -- Determinar campos alterados
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'policies' AND table_schema = 'public'
    LOOP
      IF (row_to_json(OLD) ->> field_name) IS DISTINCT FROM (row_to_json(NEW) ->> field_name) THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
    version_num := COALESCE(OLD.version_number, 0) + 1;
    NEW.version_number := version_num;
  ELSE
    version_num := 1;
  END IF;

  -- Inserir registro de auditoria
  INSERT INTO public.policy_audit (
    policy_id,
    user_id,
    operation,
    data_before,
    data_after,
    file_hash,
    changed_fields,
    created_by,
    version_number
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    COALESCE(NEW.file_hash, OLD.file_hash),
    changed_fields,
    auth.uid(),
    version_num
  );

  -- Atualizar referência da auditoria
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    NEW.last_audit_id := (
      SELECT id FROM public.policy_audit 
      WHERE policy_id = NEW.id 
      ORDER BY created_at DESC 
      LIMIT 1
    );
    RETURN NEW;
  END IF;

  RETURN OLD;
END;
$$;