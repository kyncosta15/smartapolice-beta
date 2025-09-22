-- Adicionar campos faltantes na tabela frota_veiculos se não existirem
ALTER TABLE frota_veiculos 
ADD COLUMN IF NOT EXISTS codigo_interno TEXT,
ADD COLUMN IF NOT EXISTS familia TEXT,
ADD COLUMN IF NOT EXISTS status_veiculo TEXT DEFAULT 'ativo';

-- Criar tabela de configurações de importação por empresa
CREATE TABLE IF NOT EXISTS company_import_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  auto_fill_enabled boolean DEFAULT true,
  update_policy text DEFAULT 'empty_only' CHECK (update_policy IN ('empty_only', 'whitelist', 'block_conflicts')),
  allowed_fields jsonb DEFAULT '[]'::jsonb,
  category_mapping jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Criar tabela de auditoria campo-a-campo
CREATE TABLE IF NOT EXISTS veiculo_field_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid NOT NULL REFERENCES frota_veiculos(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  previous_value text,
  new_value text,
  source text NOT NULL CHECK (source IN ('n8n_xlsx', 'manual', 'reversal')),
  import_job_id text,
  applied_by uuid,
  applied_at timestamptz DEFAULT now(),
  reverted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índice único para evitar duplicatas por job/valor
CREATE UNIQUE INDEX IF NOT EXISTS uix_vfs_dedupe
ON veiculo_field_sources(veiculo_id, field_name, import_job_id, new_value)
WHERE reverted_at IS NULL;

-- Criar tabela de jobs de importação
CREATE TABLE IF NOT EXISTS import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text UNIQUE NOT NULL,
  empresa_id uuid NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  summary jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE company_import_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculo_field_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Company import settings policies
CREATE POLICY "Users can manage their company import settings" ON company_import_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'administrador', 'rh', 'corretora_admin')
    AND e.id = company_import_settings.empresa_id
  )
);

-- Veiculo field sources policies  
CREATE POLICY "Users can view field sources for their company vehicles" ON veiculo_field_sources
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM frota_veiculos fv
    JOIN users u ON TRUE
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid()
    AND e.id = fv.empresa_id
    AND fv.id = veiculo_field_sources.veiculo_id
  )
);

CREATE POLICY "Service can manage all field sources" ON veiculo_field_sources
FOR ALL USING (true);

-- Import jobs policies
CREATE POLICY "Users can view their company import jobs" ON import_jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid()
    AND e.id = import_jobs.empresa_id
  )
);

CREATE POLICY "Service can manage all import jobs" ON import_jobs
FOR ALL USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_company_import_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_import_settings_updated_at
  BEFORE UPDATE ON company_import_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_import_settings_updated_at();

CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();