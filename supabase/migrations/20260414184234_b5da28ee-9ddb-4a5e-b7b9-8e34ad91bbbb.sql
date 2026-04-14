
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função que dispara sync para cada config ativa
CREATE OR REPLACE FUNCTION public.trigger_sinistro_sheet_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config RECORD;
BEGIN
  FOR config IN 
    SELECT id, sheet_url, empresa_id 
    FROM public.sinistro_sheet_configs 
    WHERE status = 'ativo'
  LOOP
    PERFORM extensions.http_post(
      url := 'https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/sync-sinistros-sheet',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg'
      ),
      body := jsonb_build_object(
        'config_id', config.id,
        'sheet_url', config.sheet_url,
        'empresa_id', config.empresa_id
      )
    );
    RAISE LOG 'Sinistro sync disparado para config %', config.id;
  END LOOP;
END;
$$;

-- Agendar cron job diário às 06:00 (UTC)
SELECT cron.schedule(
  'sync-sinistros-daily',
  '0 6 * * *',
  $$SELECT public.trigger_sinistro_sheet_sync()$$
);
