-- Adicionar coluna para nome do plano de saúde
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS nome_plano_saude VARCHAR(255);