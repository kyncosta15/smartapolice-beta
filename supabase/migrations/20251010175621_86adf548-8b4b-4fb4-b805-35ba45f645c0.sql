-- Tabela para configuração de envio automático de relatórios
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  nome_destinatario TEXT NOT NULL,
  frequencia_dias INTEGER NOT NULL DEFAULT 30 CHECK (frequencia_dias IN (30, 60)),
  dia_envio INTEGER NOT NULL DEFAULT 1 CHECK (dia_envio >= 1 AND dia_envio <= 28),
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio TIMESTAMP WITH TIME ZONE,
  proximo_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para log de envios de relatórios
CREATE TABLE IF NOT EXISTS public.report_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.report_schedules(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_report_schedules_empresa ON public.report_schedules(empresa_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_ativo ON public.report_schedules(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_proximo_envio ON public.report_schedules(proximo_envio);
CREATE INDEX IF NOT EXISTS idx_report_sends_schedule ON public.report_sends(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_sends_status ON public.report_sends(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_report_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_report_schedules_updated_at();

-- RLS Policies para report_schedules
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

-- Admin pode gerenciar tudo
CREATE POLICY "Admin pode gerenciar todos os agendamentos"
  ON public.report_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
  );

-- Empresas podem ver seus próprios agendamentos
CREATE POLICY "Empresas podem ver seus agendamentos"
  ON public.report_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid()
      AND e.id = report_schedules.empresa_id
    )
  );

-- RLS Policies para report_sends
ALTER TABLE public.report_sends ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os logs
CREATE POLICY "Admin pode ver todos os logs de envio"
  ON public.report_sends
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'administrador', 'corretora_admin')
    )
  );

-- Empresas podem ver logs de seus envios
CREATE POLICY "Empresas podem ver logs de seus envios"
  ON public.report_sends
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid()
      AND e.id = report_sends.empresa_id
    )
  );