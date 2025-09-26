-- Remove veículos antigos sem created_by da empresa padrão
-- que estão "poluindo" a visualização dos usuários
DELETE FROM public.frota_veiculos 
WHERE empresa_id = '00000000-0000-0000-0000-000000000001' 
AND created_by IS NULL;