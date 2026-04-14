
-- Deletar sinistros importados erroneamente na Falcon (origem = importacao)
DELETE FROM public.tickets 
WHERE empresa_id = '2af597f2-61e2-4fb4-82e1-e6fc0e60e082'
  AND tipo = 'sinistro'
  AND origem = 'importacao';

-- Desativar config de sincronização da Falcon
UPDATE public.sinistro_sheet_configs
SET status = 'inativo'
WHERE empresa_id = '2af597f2-61e2-4fb4-82e1-e6fc0e60e082';

-- Deletar logs de sync da config errada
DELETE FROM public.sinistro_sheet_sync_logs
WHERE config_id = '32412238-4363-4096-abc8-a6c694c06339';
