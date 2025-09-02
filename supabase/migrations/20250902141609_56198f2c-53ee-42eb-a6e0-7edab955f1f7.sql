-- Criar enums para SmartBenefícios
CREATE TYPE public.ticket_status AS ENUM (
  'recebido',
  'em_validacao', 
  'em_execucao',
  'concluido',
  'pendente_cliente',
  'cancelado'
);

CREATE TYPE public.ticket_type AS ENUM (
  'inclusao_dependente',
  'exclusao_dependente',
  'duvida_cobertura',
  'segunda_via_carteirinha',
  'duvida_geral'
);

CREATE TYPE public.colaborador_status AS ENUM (
  'ativo',
  'inativo',
  'pendente'
);

CREATE TYPE public.grau_parentesco AS ENUM (
  'conjuge',
  'filho',
  'filha',
  'mae',
  'pai',
  'outros'
);

-- Tabela de empresas clientes
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contato_rh_nome TEXT,
  contato_rh_email TEXT,
  contato_rh_telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID, -- Referencia para quando colaborador tiver login
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  cargo TEXT,
  centro_custo TEXT,
  data_admissao DATE,
  data_demissao DATE,
  status colaborador_status DEFAULT 'ativo',
  custo_mensal DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dependentes
CREATE TABLE public.dependentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  grau_parentesco grau_parentesco NOT NULL,
  status colaborador_status DEFAULT 'ativo',
  custo_mensal DECIMAL(10,2),
  documentos_anexos TEXT[], -- URLs dos documentos
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tickets/solicitações
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ticket TEXT UNIQUE NOT NULL,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  empresa_id UUID REFERENCES public.empresas(id),
  tipo ticket_type NOT NULL,
  status ticket_status DEFAULT 'recebido',
  titulo TEXT NOT NULL,
  descricao TEXT,
  dados_solicitacao JSONB, -- Dados específicos da solicitação
  canal_origem TEXT DEFAULT 'whatsapp', -- whatsapp, form, portal
  operador_responsavel UUID, -- Usuário RCaldas responsável
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_validacao TIMESTAMP WITH TIME ZONE,
  data_execucao TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de alterações
CREATE TABLE public.colaboradores_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  acao TEXT NOT NULL, -- 'inclusao', 'exclusao', 'alteracao'
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_responsavel UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas
CREATE POLICY "RH pode ver sua própria empresa" 
ON public.empresas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND (users.role = 'rh' OR users.role = 'admin')
    AND users.company = empresas.nome
  )
);

CREATE POLICY "Admin pode ver todas empresas" 
ON public.empresas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Políticas RLS para colaboradores
CREATE POLICY "RH pode ver colaboradores da sua empresa" 
ON public.colaboradores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = colaboradores.empresa_id
  )
);

CREATE POLICY "RH pode inserir colaboradores da sua empresa" 
ON public.colaboradores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = colaboradores.empresa_id
  )
);

CREATE POLICY "RH pode atualizar colaboradores da sua empresa" 
ON public.colaboradores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.empresas e ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = colaboradores.empresa_id
  )
);

-- Políticas similares para outras tabelas
CREATE POLICY "RH pode ver dependentes da sua empresa" 
ON public.dependentes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.colaboradores c
    JOIN public.empresas e ON c.empresa_id = e.id
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND c.id = dependentes.colaborador_id
  )
);

CREATE POLICY "RH pode ver tickets da sua empresa" 
ON public.tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.empresas e
    JOIN public.users u ON u.company = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin')
    AND e.id = tickets.empresa_id
  )
);

-- Funções para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_colaboradores_updated_at();

CREATE TRIGGER update_dependentes_updated_at
  BEFORE UPDATE ON public.dependentes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_colaboradores_updated_at();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_colaboradores_updated_at();

-- Função para gerar número do ticket
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_ticket = 'SB' || LPAD(EXTRACT(year FROM now())::text, 4, '0') || 
                      LPAD(EXTRACT(month FROM now())::text, 2, '0') || 
                      LPAD(nextval('ticket_sequence')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();