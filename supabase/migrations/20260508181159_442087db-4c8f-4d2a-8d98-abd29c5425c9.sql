
-- Configuração editável do workflow SmartApólice (linha singleton id=1)
CREATE TABLE IF NOT EXISTS public.smart_apolice_config (
  id integer PRIMARY KEY DEFAULT 1,
  system_prompt text NOT NULL,
  openai_model text NOT NULL DEFAULT 'gpt-4o',
  temperature numeric NOT NULL DEFAULT 0.3,
  top_p numeric NOT NULL DEFAULT 1,
  max_tokens integer NOT NULL DEFAULT 4000,
  merge_pages boolean NOT NULL DEFAULT true,
  max_pdf_mb integer NOT NULL DEFAULT 15,
  save_default boolean NOT NULL DEFAULT true,
  bucket_name text NOT NULL DEFAULT 'pdfs',
  policy_number_prefix text NOT NULL DEFAULT 'SA_',
  default_status text NOT NULL DEFAULT 'vigente',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT smart_apolice_config_singleton CHECK (id = 1)
);

ALTER TABLE public.smart_apolice_config ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/escrever (edge function usa service role e bypassa RLS)
DROP POLICY IF EXISTS "admins read smart_apolice_config" ON public.smart_apolice_config;
CREATE POLICY "admins read smart_apolice_config"
  ON public.smart_apolice_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins update smart_apolice_config" ON public.smart_apolice_config;
CREATE POLICY "admins update smart_apolice_config"
  ON public.smart_apolice_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins insert smart_apolice_config" ON public.smart_apolice_config;
CREATE POLICY "admins insert smart_apolice_config"
  ON public.smart_apolice_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed da linha única com o prompt atual
INSERT INTO public.smart_apolice_config (id, system_prompt)
VALUES (
  1,
  'Você é um extrator de dados de apólices de seguro.

Sua tarefa é extrair dados estruturados de apólice de seguro do texto fornecido.

Retorne APENAS JSON compacto (sem espaços extras) no seguinte formato:

{"segurado":"","documento":"","documento_tipo":"","dataNascimento":"","seguradora":"","numeroApolice":"","inicioVigencia":"","fimVigencia":"","tipoSeguro":"","modeloVeiculo":"","placa":"","anoModelo":"","valorPremio":0,"quantidadeParcelas":0,"valorParcela":0,"formaPagamento":"","franquia":0,"condutorPrincipal":"","email":"","telefone":"","status":"Ativa","corretora":"","cidade":"","uf":"","coberturas":[]}

Regras:
- documento_tipo: CPF (11 dígitos), CNPJ (14 dígitos), ou DESCONHECIDO
- tipoSeguro: infira do contexto (automóvel, residencial, vida, etc.)
- Datas: yyyy-mm-dd
- Números sem R$ ou %
- Campos vazios: números=0, textos="", datas=null
- coberturas: array de objetos com formato {"descricao": "nome da cobertura", "lmi": valor_numerico}. Extraia o valor LMI (Limite Máximo de Indenização) como número sem R$ ou formatação. Se não houver valor numérico, use null
- Sem explicações ou comentários'
)
ON CONFLICT (id) DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.smart_apolice_config_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_smart_apolice_config_touch ON public.smart_apolice_config;
CREATE TRIGGER trg_smart_apolice_config_touch
  BEFORE UPDATE ON public.smart_apolice_config
  FOR EACH ROW EXECUTE FUNCTION public.smart_apolice_config_touch();
