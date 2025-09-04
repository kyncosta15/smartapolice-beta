-- Add classification column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS classification text DEFAULT 'Corretora';

-- Update existing users to have default classification
UPDATE public.users 
SET classification = 'Corretora' 
WHERE classification IS NULL;