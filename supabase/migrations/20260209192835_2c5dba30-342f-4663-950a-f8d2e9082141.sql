-- Permitir placa NULL para veículos sem placa (gestão de frotas)
ALTER TABLE public.frota_veiculos ALTER COLUMN placa DROP NOT NULL;

-- Criar unique index parcial: empresa_id + placa apenas quando placa não é null
-- Isso permite múltiplos veículos sem placa na mesma empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_frota_veiculos_empresa_placa 
ON public.frota_veiculos (empresa_id, placa) 
WHERE placa IS NOT NULL;