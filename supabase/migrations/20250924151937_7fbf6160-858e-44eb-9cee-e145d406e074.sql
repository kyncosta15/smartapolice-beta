-- Criar tabela de solicitações de alteração de frota
CREATE TABLE IF NOT EXISTS fleet_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vehicle_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'inclusao_veiculo','exclusao_veiculo','tirar_do_seguro',
    'colocar_no_seguro','atualizacao_dados','mudanca_responsavel','documentacao'
  )),
  placa TEXT,
  chassi TEXT,
  renavam TEXT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_triagem','aprovado','executado','recusado')),
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa','normal','alta')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de tokens para links públicos
CREATE TABLE IF NOT EXISTS public_fleet_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  empresa_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fleet_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fleet_change_requests_updated_at
  BEFORE UPDATE ON fleet_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_fleet_change_requests_updated_at();

-- RLS para fleet_change_requests
ALTER TABLE fleet_change_requests ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver/criar solicitações da própria empresa
CREATE POLICY "fcr_select_own_company" ON fleet_change_requests
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome
  WHERE u.id = auth.uid() AND e.id = empresa_id
));

CREATE POLICY "fcr_insert_own_company" ON fleet_change_requests
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome
  WHERE u.id = auth.uid() AND e.id = empresa_id
));

CREATE POLICY "fcr_update_own_company" ON fleet_change_requests
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome
  WHERE u.id = auth.uid() AND e.id = empresa_id
));

-- Admins podem ver tudo
CREATE POLICY "fcr_admin_all" ON fleet_change_requests
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrador', 'corretora_admin')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrador', 'corretora_admin')
));

-- RLS para public_fleet_tokens
ALTER TABLE public_fleet_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pft_own_company" ON public_fleet_tokens
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome
  WHERE u.id = auth.uid() AND e.id = empresa_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome
  WHERE u.id = auth.uid() AND e.id = empresa_id
));

-- Criar bucket de storage para solicitações
INSERT INTO storage.buckets (id, name, public) 
VALUES ('solicitacoes-frota', 'solicitacoes-frota', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para solicitações
CREATE POLICY "fleet_requests_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'solicitacoes-frota');

CREATE POLICY "fleet_requests_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'solicitacoes-frota' AND (
    -- Usuário pode ver arquivos da própria empresa
    EXISTS (
      SELECT 1 FROM fleet_change_requests fcr
      JOIN users u ON u.id = auth.uid()
      JOIN empresas e ON u.company::text = e.nome
      WHERE fcr.id::text = (storage.foldername(name))[1]
      AND e.id = fcr.empresa_id
    ) OR
    -- Admins podem ver tudo
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
  ));

CREATE POLICY "fleet_requests_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'solicitacoes-frota' AND (
    -- Usuário pode deletar arquivos da própria empresa
    EXISTS (
      SELECT 1 FROM fleet_change_requests fcr
      JOIN users u ON u.id = auth.uid()
      JOIN empresas e ON u.company::text = e.nome
      WHERE fcr.id::text = (storage.foldername(name))[1]
      AND e.id = fcr.empresa_id
    ) OR
    -- Admins podem deletar tudo
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
  ));