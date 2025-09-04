-- Corrigir status das solicitações aprovadas pelo RH que estão com 'em_validacao' para 'aprovado_rh'
UPDATE public.requests 
SET status = 'aprovado_rh' 
WHERE status = 'em_validacao' 
  AND draft = false 
  AND EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE tickets.request_id = requests.id
  );