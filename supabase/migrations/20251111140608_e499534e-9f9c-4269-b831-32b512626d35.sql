-- Verificar se a coluna ano_modelo já não existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'policies' 
    AND column_name = 'ano_modelo'
  ) THEN
    ALTER TABLE public.policies ADD COLUMN ano_modelo character varying;
  END IF;
END $$;