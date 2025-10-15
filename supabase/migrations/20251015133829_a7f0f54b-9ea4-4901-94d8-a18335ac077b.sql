-- Step 1: Remove the old categoria check constraint
ALTER TABLE frota_veiculos 
DROP CONSTRAINT IF EXISTS frota_veiculos_categoria_check;

-- Step 2: Add 'funcao' field to frota_veiculos table
ALTER TABLE frota_veiculos 
ADD COLUMN IF NOT EXISTS funcao text;

-- Step 3: Migrate ALL existing data - normalize all category variations
-- First, preserve the original value in funcao
UPDATE frota_veiculos 
SET funcao = categoria
WHERE funcao IS NULL;

-- Now update all categories to the 3 standard values
-- Carros: Passeio, Utilitário, Carro, etc
UPDATE frota_veiculos 
SET categoria = 'Carros'
WHERE LOWER(TRIM(categoria)) IN ('passeio', 'utilitário', 'utilitario', 'carro', 'carros', 'pj', 'outros');

-- Caminhão: normalize variations
UPDATE frota_veiculos 
SET categoria = 'Caminhão'
WHERE LOWER(TRIM(categoria)) IN ('caminhão', 'caminhao', 'truck');

-- Moto: normalize variations  
UPDATE frota_veiculos 
SET categoria = 'Moto'
WHERE LOWER(TRIM(categoria)) IN ('moto', 'motocicleta', 'motorcycle');

-- Set any remaining null or unknown categories to Carros as default
UPDATE frota_veiculos 
SET categoria = 'Carros'
WHERE categoria IS NULL OR categoria NOT IN ('Carros', 'Caminhão', 'Moto');

-- Step 4: Add new check constraint with only 3 categories
ALTER TABLE frota_veiculos
ADD CONSTRAINT frota_veiculos_categoria_check 
CHECK (categoria IN ('Carros', 'Caminhão', 'Moto'));

-- Add comments for documentation
COMMENT ON COLUMN frota_veiculos.funcao IS 'Função específica do veículo (Passeio, Utilitário, etc.) - usado internamente';
COMMENT ON COLUMN frota_veiculos.categoria IS 'Categoria para API FIPE: Carros, Caminhão ou Moto';