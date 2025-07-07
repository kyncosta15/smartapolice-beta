-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para envio mensal de relatório (todo dia 1 às 9:00)
SELECT cron.schedule(
  'monthly-pdf-report',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/send-monthly-report',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpodmJmdnFodWVtdXZ3Z3Fwc2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI2MDEsImV4cCI6MjA2Njg4ODYwMX0.V8I0byW7xs0iMBEBc6C3h0lvPhgPZ4mGwjfm31XkEQg"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);