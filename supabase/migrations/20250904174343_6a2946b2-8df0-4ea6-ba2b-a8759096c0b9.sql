-- Reinicializar a solicitação SB-2025-525004 para teste
-- Voltar status para aprovado_rh para poder testar a aprovação administrativa novamente
UPDATE public.requests 
SET status = 'aprovado_rh', updated_at = now()
WHERE protocol_code = 'SB-2025-525004';

-- Remover tickets existentes desta solicitação para teste limpo
DELETE FROM public.tickets 
WHERE protocol_code = 'SB-2025-525004';

-- Remover aprovações existentes para teste limpo
DELETE FROM public.request_approvals 
WHERE request_id = (SELECT id FROM requests WHERE protocol_code = 'SB-2025-525004');