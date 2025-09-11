-- Update colaborador_submissoes table to include new document fields
ALTER TABLE public.colaborador_submissoes 
ADD COLUMN IF NOT EXISTS documentos_anexados JSONB DEFAULT '[]'::jsonb;

-- Add comment for the new column
COMMENT ON COLUMN public.colaborador_submissoes.documentos_anexados IS 'Array of attached documents with type and storage path';