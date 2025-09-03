-- Criar tabela para armazenar links gerados para colaboradores
CREATE TABLE public.colaborador_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id),
  user_id UUID NOT NULL,
  link_token TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  campos_solicitados JSONB NOT NULL DEFAULT '[]', -- Array com os campos que devem ser preenchidos
  expira_em TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar as submissões dos colaboradores
CREATE TABLE public.colaborador_submissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES public.colaborador_links(id) ON DELETE CASCADE,
  dados_preenchidos JSONB NOT NULL DEFAULT '{}',
  ip_origem TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'recebida' CHECK (status IN ('recebida', 'processada', 'rejeitada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.colaborador_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_submissoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para colaborador_links
CREATE POLICY "RH pode gerenciar links da sua empresa"
ON public.colaborador_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND e.id = colaborador_links.empresa_id
  )
);

-- Políticas RLS para colaborador_submissoes
CREATE POLICY "RH pode ver submissões da sua empresa"
ON public.colaborador_submissoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM colaborador_links cl
    JOIN empresas e ON cl.empresa_id = e.id
    JOIN users u ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND cl.id = colaborador_submissoes.link_id
  )
);

CREATE POLICY "RH pode atualizar submissões da sua empresa"
ON public.colaborador_submissoes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM colaborador_links cl
    JOIN empresas e ON cl.empresa_id = e.id
    JOIN users u ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND cl.id = colaborador_submissoes.link_id
  )
);

-- Política para permitir inserção pública nas submissões (sem autenticação)
CREATE POLICY "Permitir inserção pública de submissões"
ON public.colaborador_submissoes
FOR INSERT
WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_colaborador_links_updated_at
  BEFORE UPDATE ON public.colaborador_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apolices_beneficios_updated_at();

CREATE TRIGGER update_colaborador_submissoes_updated_at
  BEFORE UPDATE ON public.colaborador_submissoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apolices_beneficios_updated_at();

-- Índices para performance
CREATE INDEX idx_colaborador_links_token ON public.colaborador_links(link_token);
CREATE INDEX idx_colaborador_links_empresa_id ON public.colaborador_links(empresa_id);
CREATE INDEX idx_colaborador_submissoes_link_id ON public.colaborador_submissoes(link_id);
CREATE INDEX idx_colaborador_submissoes_status ON public.colaborador_submissoes(status);