-- Criar tabela para apólices do SmartBenefícios
CREATE TABLE public.apolices_beneficios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id),
  user_id UUID NOT NULL,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  tipo_beneficio TEXT NOT NULL, -- saude, odontologico, vida, etc
  seguradora TEXT NOT NULL,
  numero_apolice TEXT NOT NULL,
  inicio_vigencia DATE NOT NULL,
  fim_vigencia DATE NOT NULL,
  valor_total NUMERIC(12,2),
  valor_empresa NUMERIC(12,2),
  valor_colaborador NUMERIC(12,2),
  quantidade_vidas INTEGER DEFAULT 0,
  observacoes TEXT,
  status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'suspensa', 'vencida')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.apolices_beneficios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para apolices_beneficios
CREATE POLICY "RH pode inserir apólices da sua empresa"
ON public.apolices_beneficios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND e.id = apolices_beneficios.empresa_id
  )
);

CREATE POLICY "RH pode ver apólices da sua empresa"
ON public.apolices_beneficios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND e.id = apolices_beneficios.empresa_id
  )
);

CREATE POLICY "RH pode atualizar apólices da sua empresa"
ON public.apolices_beneficios
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND e.id = apolices_beneficios.empresa_id
  )
);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_apolices_beneficios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Criar trigger para updated_at
CREATE TRIGGER update_apolices_beneficios_updated_at
  BEFORE UPDATE ON public.apolices_beneficios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apolices_beneficios_updated_at();

-- Criar índices para melhor performance
CREATE INDEX idx_apolices_beneficios_empresa_id ON public.apolices_beneficios(empresa_id);
CREATE INDEX idx_apolices_beneficios_cnpj ON public.apolices_beneficios(cnpj);
CREATE INDEX idx_apolices_beneficios_user_id ON public.apolices_beneficios(user_id);
CREATE INDEX idx_apolices_beneficios_status ON public.apolices_beneficios(status);

-- Tabela para vincular colaboradores às apólices
CREATE TABLE public.colaborador_apolice_vinculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  apolice_id UUID REFERENCES public.apolices_beneficios(id) ON DELETE CASCADE,
  data_inclusao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_exclusao DATE,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(colaborador_id, apolice_id)
);

-- Habilitar RLS para vínculos
ALTER TABLE public.colaborador_apolice_vinculo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para colaborador_apolice_vinculo
CREATE POLICY "RH pode gerenciar vínculos da sua empresa"
ON public.colaborador_apolice_vinculo
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM colaboradores c
    JOIN empresas e ON c.empresa_id = e.id
    JOIN users u ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND c.id = colaborador_apolice_vinculo.colaborador_id
  )
);

-- Trigger para updated_at dos vínculos
CREATE TRIGGER update_colaborador_apolice_vinculo_updated_at
  BEFORE UPDATE ON public.colaborador_apolice_vinculo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apolices_beneficios_updated_at();