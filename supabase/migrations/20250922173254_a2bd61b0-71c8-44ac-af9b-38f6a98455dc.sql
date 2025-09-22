-- Adicionar novos campos à tabela frota_veiculos para incluir todos os dados do JSON/planilha
ALTER TABLE public.frota_veiculos 
ADD COLUMN IF NOT EXISTS chassi text,
ADD COLUMN IF NOT EXISTS localizacao text,
ADD COLUMN IF NOT EXISTS codigo text,
ADD COLUMN IF NOT EXISTS origem_planilha text;