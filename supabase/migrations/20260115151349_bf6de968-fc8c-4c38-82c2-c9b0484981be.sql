-- Tabela para registrar acessos do usuário por IP
CREATE TABLE public.user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hidden BOOLEAN NOT NULL DEFAULT false
);

-- Índices para consultas rápidas
CREATE INDEX idx_user_access_logs_user_id ON public.user_access_logs(user_id);
CREATE INDEX idx_user_access_logs_ip_user ON public.user_access_logs(user_id, ip_address);

-- Habilitar RLS
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuário só vê seus próprios logs
CREATE POLICY "Users can view their own access logs"
ON public.user_access_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access logs"
ON public.user_access_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own access logs"
ON public.user_access_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Função para verificar se IP já foi registrado para o usuário
CREATE OR REPLACE FUNCTION public.check_ip_exists(_user_id UUID, _ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_access_logs
    WHERE user_id = _user_id
      AND ip_address = _ip_address
  )
$$;