
-- Table for storing Google Sheets sync configurations
CREATE TABLE public.sinistro_sheet_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_url TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Planilha de Sinistros',
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sinistro_sheet_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view configs for their empresa"
ON public.sinistro_sheet_configs FOR SELECT TO authenticated
USING (empresa_id IN (
  SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()
) OR user_id = auth.uid());

CREATE POLICY "Users can insert configs"
ON public.sinistro_sheet_configs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their configs"
ON public.sinistro_sheet_configs FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their configs"
ON public.sinistro_sheet_configs FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_sinistro_sheet_configs_updated_at
BEFORE UPDATE ON public.sinistro_sheet_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync logs table
CREATE TABLE public.sinistro_sheet_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.sinistro_sheet_configs(id) ON DELETE CASCADE,
  registros_encontrados INTEGER DEFAULT 0,
  registros_novos INTEGER DEFAULT 0,
  registros_existentes INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  detalhes JSONB,
  status TEXT NOT NULL DEFAULT 'sucesso',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sinistro_sheet_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs for their configs"
ON public.sinistro_sheet_sync_logs FOR SELECT TO authenticated
USING (config_id IN (
  SELECT id FROM public.sinistro_sheet_configs WHERE user_id = auth.uid()
  OR empresa_id IN (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid())
));

CREATE POLICY "System can insert sync logs"
ON public.sinistro_sheet_sync_logs FOR INSERT TO authenticated
WITH CHECK (true);
