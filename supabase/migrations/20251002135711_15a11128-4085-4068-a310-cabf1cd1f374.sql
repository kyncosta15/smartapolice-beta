-- Garantir que frota_veiculos tenha os campos necessários para FIPE
ALTER TABLE frota_veiculos 
ADD COLUMN IF NOT EXISTS marca TEXT,
ADD COLUMN IF NOT EXISTS modelo TEXT,
ADD COLUMN IF NOT EXISTS ano_modelo INTEGER,
ADD COLUMN IF NOT EXISTS combustivel TEXT,
ADD COLUMN IF NOT EXISTS tipo_veiculo INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS codigo_fipe TEXT;

-- Criar índices para melhorar performance de filtros
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_marca ON frota_veiculos(marca);
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_modelo ON frota_veiculos(modelo);
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_ano_modelo ON frota_veiculos(ano_modelo);
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_combustivel ON frota_veiculos(combustivel);

-- Criar tabela de cache FIPE
CREATE TABLE IF NOT EXISTS fipe_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES frota_veiculos(id) ON DELETE CASCADE,
  tabela_ref INTEGER NOT NULL,
  price_value NUMERIC(12,2),
  price_label TEXT,
  brand TEXT,
  model TEXT,
  year_model INTEGER,
  fuel TEXT,
  fuel_code INTEGER,
  fipe_code TEXT,
  data_consulta TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice único para evitar duplicatas (um cache por veículo por tabela de referência)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fipe_cache_tenant_vehicle_unique 
ON fipe_cache(tenant_id, vehicle_id, tabela_ref);

-- Índice para buscar cache por tenant
CREATE INDEX IF NOT EXISTS idx_fipe_cache_tenant ON fipe_cache(tenant_id);

-- Índice para buscar cache por veículo
CREATE INDEX IF NOT EXISTS idx_fipe_cache_vehicle ON fipe_cache(vehicle_id);

-- Índice para buscar caches recentes
CREATE INDEX IF NOT EXISTS idx_fipe_cache_data_consulta ON fipe_cache(data_consulta DESC);

-- RLS policies para fipe_cache
ALTER TABLE fipe_cache ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "fipe_cache_select_policy" ON fipe_cache
FOR SELECT
USING (tenant_id = current_empresa_id());

-- Policy para INSERT
CREATE POLICY "fipe_cache_insert_policy" ON fipe_cache
FOR INSERT
WITH CHECK (tenant_id = current_empresa_id() AND auth.uid() IS NOT NULL);

-- Policy para UPDATE
CREATE POLICY "fipe_cache_update_policy" ON fipe_cache
FOR UPDATE
USING (tenant_id = current_empresa_id() AND auth.uid() IS NOT NULL);

-- Policy para DELETE
CREATE POLICY "fipe_cache_delete_policy" ON fipe_cache
FOR DELETE
USING (tenant_id = current_empresa_id() AND auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fipe_cache_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER fipe_cache_updated_at
BEFORE UPDATE ON fipe_cache
FOR EACH ROW
EXECUTE FUNCTION update_fipe_cache_updated_at();

-- Comentários nas tabelas
COMMENT ON TABLE fipe_cache IS 'Cache de consultas FIPE para evitar chamadas desnecessárias à API';
COMMENT ON COLUMN fipe_cache.tenant_id IS 'ID da empresa (multi-tenant)';
COMMENT ON COLUMN fipe_cache.vehicle_id IS 'ID do veículo consultado';
COMMENT ON COLUMN fipe_cache.tabela_ref IS 'Código da tabela de referência FIPE';
COMMENT ON COLUMN fipe_cache.price_value IS 'Valor numérico do preço';
COMMENT ON COLUMN fipe_cache.price_label IS 'Valor formatado (ex: R$ 39.225,00)';
COMMENT ON COLUMN fipe_cache.fuel_code IS '1=Gasolina, 2=Álcool, 3=Diesel/Flex, 4=Gás';
COMMENT ON COLUMN fipe_cache.data_consulta IS 'Data/hora da consulta FIPE';
COMMENT ON COLUMN fipe_cache.raw_response IS 'Resposta completa da API FIPE em JSON';