-- Tabela para configuração de webhooks N8N
CREATE TABLE public.n8n_webhooks_config (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.n8n_webhooks_config ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver
CREATE POLICY "Admins podem ver webhooks config"
ON public.n8n_webhooks_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text IN ('admin', 'administrador', 'corretora_admin')
  )
);

-- Política: apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar webhooks config"
ON public.n8n_webhooks_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text IN ('admin', 'administrador', 'corretora_admin')
  )
);

-- Política: apenas admins podem inserir
CREATE POLICY "Admins podem inserir webhooks config"
ON public.n8n_webhooks_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role::text IN ('admin', 'administrador', 'corretora_admin')
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_n8n_webhooks_config_updated_at
BEFORE UPDATE ON public.n8n_webhooks_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os 3 webhooks iniciais
INSERT INTO public.n8n_webhooks_config (id, nome, descricao, url) VALUES
('pdf_frota', 'PDF Frota', 'Webhook para processar PDFs de cotações de frota', 'https://rcorpcaldas.app.n8n.cloud/webhook/pdf-frota'),
('planilha_frota', 'Planilha Frota', 'Webhook para processar planilhas Excel de frota', 'https://rcorpcaldas.app.n8n.cloud/webhook/upload-planilha'),
('apolices_pdf', 'Apólices PDF', 'Webhook para processar PDFs de apólices gerais', 'https://rcorpcaldas.app.n8n.cloud/webhook/upload-arquivo');