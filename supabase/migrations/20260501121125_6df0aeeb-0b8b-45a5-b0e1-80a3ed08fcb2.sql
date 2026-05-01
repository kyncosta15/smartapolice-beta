
-- =========================================================
-- MÓDULO CONSULTORIA PREMIUM — Fase 1
-- =========================================================

-- 1. Tabela de configuração global (orientações editáveis pelo master/admin)
CREATE TABLE public.consultoria_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  prompt_mestre TEXT NOT NULL DEFAULT '',
  modelo_parecer TEXT NOT NULL DEFAULT '',
  tom_voz TEXT NOT NULL DEFAULT 'objetivo, consultivo, com alertas em destaque e oportunidades sempre quantificadas',
  criterios JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- 2. Casos de consultoria (1 caso = 1 análise, pode cobrir múltiplos CNPJs)
CREATE TABLE public.consultoria_casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  tipo_caso TEXT NOT NULL DEFAULT 'individual' CHECK (tipo_caso IN ('individual','grupo')),
  cnpjs TEXT[] DEFAULT '{}',
  perfil JSONB NOT NULL DEFAULT '{}'::jsonb,
  modo_layout TEXT NOT NULL DEFAULT 'completo' CHECK (modo_layout IN ('completo','enxuto')),
  revisao_obrigatoria BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','em_revisao','entregue','cancelado')),
  responsaveis TEXT[] DEFAULT ARRAY['Rodrigo Caldas','Rafael Caldas'],
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
CREATE INDEX idx_consultoria_casos_empresa ON public.consultoria_casos(empresa_id);
CREATE INDEX idx_consultoria_casos_status ON public.consultoria_casos(status);
CREATE INDEX idx_consultoria_casos_client ON public.consultoria_casos(client_id);

-- 3. Documentos anexados ao caso
CREATE TABLE public.consultoria_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES public.consultoria_casos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_original TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  cnpj_referencia TEXT,
  metadados_extraidos JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultoria_documentos_caso ON public.consultoria_documentos(caso_id);

-- 4. Pareceres gerados
CREATE TABLE public.consultoria_pareceres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES public.consultoria_casos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  estrutura JSONB NOT NULL DEFAULT '{}'::jsonb,
  resumo_executivo TEXT,
  oportunidade_capitalizacao_total NUMERIC(15,2) DEFAULT 0,
  economia_anual_estimada NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','em_revisao','aprovado','entregue')),
  ia_modelo TEXT,
  ia_tokens_uso JSONB,
  pdf_storage_path TEXT,
  revisado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revisado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultoria_pareceres_caso ON public.consultoria_pareceres(caso_id);

-- 5. Lacunas identificadas (granular para reaproveitamento e rastreio)
CREATE TABLE public.consultoria_lacunas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parecer_id UUID NOT NULL REFERENCES public.consultoria_pareceres(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  severidade TEXT NOT NULL DEFAULT 'media' CHECK (severidade IN ('baixa','media','alta','critica')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  recomendacao TEXT,
  valor_estimado NUMERIC(15,2),
  cnpj_referencia TEXT,
  documento_origem_id UUID REFERENCES public.consultoria_documentos(id) ON DELETE SET NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultoria_lacunas_parecer ON public.consultoria_lacunas(parecer_id);

-- =========================================================
-- RLS — multi-tenant via user_memberships
-- =========================================================
ALTER TABLE public.consultoria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultoria_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultoria_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultoria_pareceres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultoria_lacunas ENABLE ROW LEVEL SECURITY;

-- Helper function (segurança definer) — verifica se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_belongs_to_empresa(_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_memberships
    WHERE user_id = auth.uid() AND empresa_id = _empresa_id
  );
$$;

-- Policies genéricas (membros da empresa têm acesso completo)
CREATE POLICY "consultoria_config_member_all" ON public.consultoria_config
  FOR ALL USING (public.user_belongs_to_empresa(empresa_id))
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "consultoria_casos_member_all" ON public.consultoria_casos
  FOR ALL USING (public.user_belongs_to_empresa(empresa_id))
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "consultoria_documentos_member_all" ON public.consultoria_documentos
  FOR ALL USING (public.user_belongs_to_empresa(empresa_id))
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "consultoria_pareceres_member_all" ON public.consultoria_pareceres
  FOR ALL USING (public.user_belongs_to_empresa(empresa_id))
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

CREATE POLICY "consultoria_lacunas_member_all" ON public.consultoria_lacunas
  FOR ALL USING (public.user_belongs_to_empresa(empresa_id))
  WITH CHECK (public.user_belongs_to_empresa(empresa_id));

-- =========================================================
-- Trigger updated_at
-- =========================================================
CREATE TRIGGER trg_consultoria_config_updated BEFORE UPDATE ON public.consultoria_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_consultoria_casos_updated BEFORE UPDATE ON public.consultoria_casos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_consultoria_pareceres_updated BEFORE UPDATE ON public.consultoria_pareceres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- STORAGE bucket — privado, RLS por empresa
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultoria-documentos', 'consultoria-documentos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "consultoria_storage_member_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'consultoria-documentos'
    AND public.user_belongs_to_empresa((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "consultoria_storage_member_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'consultoria-documentos'
    AND public.user_belongs_to_empresa((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "consultoria_storage_member_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'consultoria-documentos'
    AND public.user_belongs_to_empresa((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "consultoria_storage_member_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'consultoria-documentos'
    AND public.user_belongs_to_empresa((storage.foldername(name))[1]::uuid)
  );
