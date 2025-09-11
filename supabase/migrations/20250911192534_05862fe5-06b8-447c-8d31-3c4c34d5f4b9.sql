-- Criar tabela de auditoria para controle de versões
CREATE TABLE IF NOT EXISTS public.policy_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL,
  user_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data_before JSONB,
  data_after JSONB,
  file_hash TEXT,
  changed_fields TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  version_number INTEGER NOT NULL DEFAULT 1
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_policy_audit_policy_id ON public.policy_audit(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_user_id ON public.policy_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_created_at ON public.policy_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_policy_audit_file_hash ON public.policy_audit(file_hash);

-- Criar tabela para campos confirmados
CREATE TABLE IF NOT EXISTS public.policy_confirmed_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_by UUID REFERENCES auth.users(id),
  UNIQUE(policy_id, field_name)
);

-- Índice para campos confirmados
CREATE INDEX IF NOT EXISTS idx_policy_confirmed_fields_policy_id ON public.policy_confirmed_fields(policy_id);

-- Adicionar coluna de hash do arquivo na tabela policies se não existir
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS last_audit_id UUID;

-- Criar índice único para evitar duplicatas (upsert idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_policies_unique_per_user 
ON public.policies(user_id, seguradora, numero_apolice, COALESCE(placa, documento, ''));

-- Função para gerar hash de arquivo
CREATE OR REPLACE FUNCTION public.generate_file_hash(file_content BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(file_content, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.audit_policy_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_audit_policies ON public.policies;
CREATE TRIGGER trigger_audit_policies
  BEFORE INSERT OR UPDATE OR DELETE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.audit_policy_changes();

-- RLS para tabelas de auditoria
ALTER TABLE public.policy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_confirmed_fields ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para auditoria
CREATE POLICY "Users can view their own policy audit" ON public.policy_audit
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit records" ON public.policy_audit
  FOR INSERT WITH CHECK (true);

-- Políticas RLS para campos confirmados
CREATE POLICY "Users can view their own confirmed fields" ON public.policy_confirmed_fields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.policies p 
      WHERE p.id = policy_confirmed_fields.policy_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own confirmed fields" ON public.policy_confirmed_fields
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.policies p 
      WHERE p.id = policy_confirmed_fields.policy_id 
      AND p.user_id = auth.uid()
    )
  );