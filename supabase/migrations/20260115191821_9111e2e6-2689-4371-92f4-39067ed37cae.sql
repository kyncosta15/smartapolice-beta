-- =====================================================
-- PRESENCE SYSTEM - IP TRACKING WITH HASH + HEARTBEAT
-- =====================================================

-- Tabela para registro de IPs por tenant/usuário (com hash para LGPD)
CREATE TABLE public.tenant_ip_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ip_hash TEXT NOT NULL,
  device_id TEXT, -- fingerprint adicional (localStorage)
  display_name TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_seen INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, ip_hash, device_id)
);

-- Índices para consultas rápidas
CREATE INDEX idx_tenant_ip_registry_tenant ON public.tenant_ip_registry(tenant_id);
CREATE INDEX idx_tenant_ip_registry_ip_hash ON public.tenant_ip_registry(ip_hash);
CREATE INDEX idx_tenant_ip_registry_tenant_ip ON public.tenant_ip_registry(tenant_id, ip_hash);

-- Tabela para sessões de presença (heartbeat)
CREATE TABLE public.presence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID, -- referência ao auth.users se autenticado
  ip_hash TEXT NOT NULL,
  device_id TEXT,
  display_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  current_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas de presença em tempo real
CREATE INDEX idx_presence_sessions_tenant ON public.presence_sessions(tenant_id);
CREATE INDEX idx_presence_sessions_user ON public.presence_sessions(user_id);
CREATE INDEX idx_presence_sessions_heartbeat ON public.presence_sessions(tenant_id, last_heartbeat_at);
CREATE INDEX idx_presence_sessions_active ON public.presence_sessions(tenant_id, last_heartbeat_at, ended_at) 
  WHERE ended_at IS NULL;

-- Habilitar RLS
ALTER TABLE public.tenant_ip_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenant_ip_registry
CREATE POLICY "Users can view their own tenant IP registry"
ON public.tenant_ip_registry
FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own tenant IP registry"
ON public.tenant_ip_registry
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own tenant IP registry"
ON public.tenant_ip_registry
FOR UPDATE
TO authenticated
USING (tenant_id = auth.uid());

-- Políticas RLS para presence_sessions
CREATE POLICY "Users can view their own presence sessions"
ON public.presence_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own presence sessions"
ON public.presence_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence sessions"
ON public.presence_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ver todas as sessões e registros
CREATE POLICY "Admins can view all IP registry"
ON public.tenant_ip_registry
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

CREATE POLICY "Admins can view all presence sessions"
ON public.presence_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para tenant_ip_registry
CREATE TRIGGER update_tenant_ip_registry_updated_at
  BEFORE UPDATE ON public.tenant_ip_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_presence_updated_at();

-- Habilitar Realtime para presence_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence_sessions;