-- Verificar e criar enums apenas se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE public.ticket_status AS ENUM (
          'recebido',
          'em_validacao', 
          'em_execucao',
          'concluido',
          'pendente_cliente',
          'cancelado'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_type') THEN
        CREATE TYPE public.ticket_type AS ENUM (
          'inclusao_dependente',
          'exclusao_dependente',
          'duvida_cobertura',
          'segunda_via_carteirinha',
          'duvida_geral'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'colaborador_status') THEN
        CREATE TYPE public.colaborador_status AS ENUM (
          'ativo',
          'inativo',
          'pendente'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grau_parentesco') THEN
        CREATE TYPE public.grau_parentesco AS ENUM (
          'conjuge',
          'filho',
          'filha',
          'mae',
          'pai',
          'outros'
        );
    END IF;
END $$;

-- Criar tabelas apenas se não existirem
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contato_rh_nome TEXT,
  contato_rh_email TEXT,
  contato_rh_telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID,
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

CREATE TABLE IF NOT EXISTS public.dependentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  grau_parentesco grau_parentesco NOT NULL,
  status colaborador_status DEFAULT 'ativo',
  custo_mensal DECIMAL(10,2),
  documentos_anexos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ticket TEXT UNIQUE,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  empresa_id UUID REFERENCES public.empresas(id),
  tipo ticket_type NOT NULL,
  status ticket_status DEFAULT 'recebido',
  titulo TEXT NOT NULL,
  descricao TEXT,
  dados_solicitacao JSONB,
  canal_origem TEXT DEFAULT 'whatsapp',
  operador_responsavel UUID,
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_validacao TIMESTAMP WITH TIME ZONE,
  data_execucao TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colaboradores_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_responsavel UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);