-- Criar tabelas para Gestão de Frotas

-- Tabela principal de veículos da frota
CREATE TABLE public.frota_veiculos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  placa text NOT NULL,
  renavam text,
  marca text,
  modelo text,
  ano_modelo integer,
  categoria text CHECK (categoria IN ('passeio', 'utilitario', 'caminhao', 'moto', 'outros')),
  proprietario_tipo text CHECK (proprietario_tipo IN ('pj', 'pf')),
  proprietario_doc text, -- cnpj/cpf
  proprietario_nome text,
  uf_emplacamento text,
  data_venc_emplacamento date,
  status_seguro text CHECK (status_seguro IN ('segurado', 'sem_seguro', 'cotacao')) DEFAULT 'sem_seguro',
  preco_fipe numeric(12,2),
  preco_nf numeric(12,2),
  percentual_tabela numeric(5,4), -- ex: 0.90
  modalidade_compra text CHECK (modalidade_compra IN ('financiado', 'avista', 'consorcio')),
  consorcio_grupo text,
  consorcio_cota text,
  consorcio_taxa_adm numeric(5,4),
  data_venc_ultima_parcela date,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índice único para placa por empresa
CREATE UNIQUE INDEX IF NOT EXISTS uq_frota_placa_empresa ON public.frota_veiculos (empresa_id, placa);

-- Tabela de responsáveis/motoristas
CREATE TABLE public.frota_responsaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id uuid NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  cnh_numero text,
  cnh_validade date,
  cnh_url text, -- foto CNH no Storage
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de pagamentos/parcelas
CREATE TABLE public.frota_pagamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id uuid NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('parcela', 'licenciamento', 'seguro', 'outros')),
  valor numeric(12,2) NOT NULL,
  vencimento date NOT NULL,
  status text NOT NULL CHECK (status IN ('pago', 'pendente', 'atrasado')) DEFAULT 'pendente',
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de documentos
CREATE TABLE public.frota_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id uuid NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('nf', 'crlv', 'termo_responsabilidade', 'termo_devolucao', 'contrato', 'outro')),
  nome_arquivo text NOT NULL,
  url text NOT NULL, -- Storage URL
  origem text NOT NULL CHECK (origem IN ('upload', 'extracao')) DEFAULT 'upload',
  tamanho_arquivo bigint,
  tipo_mime text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.frota_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frota_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frota_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frota_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para frota_veiculos
CREATE POLICY "RH pode ver veículos da sua empresa" 
ON public.frota_veiculos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = frota_veiculos.empresa_id
));

CREATE POLICY "RH pode inserir veículos da sua empresa" 
ON public.frota_veiculos 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = frota_veiculos.empresa_id
));

CREATE POLICY "RH pode atualizar veículos da sua empresa" 
ON public.frota_veiculos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = frota_veiculos.empresa_id
));

CREATE POLICY "RH pode deletar veículos da sua empresa" 
ON public.frota_veiculos 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM users u 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = frota_veiculos.empresa_id
));

-- Políticas RLS para frota_responsaveis
CREATE POLICY "RH pode gerenciar responsáveis da sua empresa" 
ON public.frota_responsaveis 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM frota_veiculos fv 
  JOIN users u ON TRUE 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = fv.empresa_id 
  AND fv.id = frota_responsaveis.veiculo_id
));

-- Políticas RLS para frota_pagamentos
CREATE POLICY "RH pode gerenciar pagamentos da sua empresa" 
ON public.frota_pagamentos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM frota_veiculos fv 
  JOIN users u ON TRUE 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = fv.empresa_id 
  AND fv.id = frota_pagamentos.veiculo_id
));

-- Políticas RLS para frota_documentos
CREATE POLICY "RH pode gerenciar documentos da sua empresa" 
ON public.frota_documentos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM frota_veiculos fv 
  JOIN users u ON TRUE 
  JOIN empresas e ON u.company::text = e.nome 
  WHERE u.id = auth.uid() 
  AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  AND e.id = fv.empresa_id 
  AND fv.id = frota_documentos.veiculo_id
));

-- Trigger para updated_at em frota_veiculos
CREATE OR REPLACE FUNCTION public.update_frota_veiculos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_frota_veiculos_updated_at
  BEFORE UPDATE ON public.frota_veiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_frota_veiculos_updated_at();

-- Trigger para updated_at em frota_responsaveis
CREATE OR REPLACE FUNCTION public.update_frota_responsaveis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_frota_responsaveis_updated_at
  BEFORE UPDATE ON public.frota_responsaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_frota_responsaveis_updated_at();

-- Trigger para updated_at em frota_pagamentos
CREATE OR REPLACE FUNCTION public.update_frota_pagamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_frota_pagamentos_updated_at
  BEFORE UPDATE ON public.frota_pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_frota_pagamentos_updated_at();

-- Criar bucket para documentos de frota
INSERT INTO storage.buckets (id, name, public) 
VALUES ('frotas_docs', 'frotas_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Política de storage para documentos de frota
CREATE POLICY "RH pode fazer upload de documentos da sua empresa" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  )
);

CREATE POLICY "RH pode ver documentos da sua empresa" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  )
);

CREATE POLICY "RH pode deletar documentos da sua empresa" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'frotas_docs' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role::text IN ('rh', 'admin', 'administrador', 'corretora_admin')
  )
);