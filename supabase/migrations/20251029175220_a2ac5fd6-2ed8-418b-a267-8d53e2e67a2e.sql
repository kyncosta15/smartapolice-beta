-- Criar tabela para armazenar apólices vindas da API CorpNuvem
CREATE TABLE IF NOT EXISTS public.apolices_corpnuvem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da API CorpNuvem
  codfil integer,
  nosnum integer NOT NULL,
  tipdoc text,
  seguradora text,
  ramo text,
  cliente_codigo integer,
  cliente_nome text,
  cliente_documento text NOT NULL, -- CPF ou CNPJ usado como FK
  
  -- Vigência
  inivig date,
  fimvig date,
  
  -- Apólice/Endosso
  numapo text,
  numend text,
  
  -- Status
  sin_situacao integer,
  cancelado text,
  renovacao_situacao integer,
  nosnum_ren integer,
  
  -- Controle
  historico_imagem integer,
  dat_inc timestamp with time zone,
  
  -- Dados de sincronização
  ultima_sincronizacao timestamp with time zone DEFAULT now(),
  dados_completos jsonb, -- Armazena o JSON completo da API
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraint única por documento da apólice
  UNIQUE(nosnum, codfil)
);

-- Índices para performance
CREATE INDEX idx_apolices_corpnuvem_user_id ON public.apolices_corpnuvem(user_id);
CREATE INDEX idx_apolices_corpnuvem_documento ON public.apolices_corpnuvem(cliente_documento);
CREATE INDEX idx_apolices_corpnuvem_nosnum ON public.apolices_corpnuvem(nosnum);
CREATE INDEX idx_apolices_corpnuvem_vigencia ON public.apolices_corpnuvem(fimvig);

-- Habilitar RLS
ALTER TABLE public.apolices_corpnuvem ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias apólices CorpNuvem"
  ON public.apolices_corpnuvem
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir apólices CorpNuvem"
  ON public.apolices_corpnuvem
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sistema pode atualizar apólices CorpNuvem"
  ON public.apolices_corpnuvem
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as apólices CorpNuvem"
  ON public.apolices_corpnuvem
  FOR SELECT
  USING (is_super_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_apolices_corpnuvem_updated_at
  BEFORE UPDATE ON public.apolices_corpnuvem
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.apolices_corpnuvem IS 'Apólices sincronizadas da API CorpNuvem vinculadas por CPF/CNPJ';
COMMENT ON COLUMN public.apolices_corpnuvem.cliente_documento IS 'CPF ou CNPJ do cliente usado como chave de relacionamento';