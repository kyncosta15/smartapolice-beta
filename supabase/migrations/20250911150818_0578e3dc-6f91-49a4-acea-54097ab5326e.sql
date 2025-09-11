-- Create storage bucket for smartbeneficios if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('smartbeneficios', 'smartbeneficios', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for smartbeneficios bucket
CREATE POLICY "Authenticated users can upload files to smartbeneficios bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'smartbeneficios' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view files in smartbeneficios bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'smartbeneficios' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update files in smartbeneficios bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'smartbeneficios' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'smartbeneficios' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete files in smartbeneficios bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'smartbeneficios' AND auth.uid() IS NOT NULL);

-- Create table to track employee documents
CREATE TABLE IF NOT EXISTS public.colaborador_documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL, -- 'documento_pessoal', 'comprovante_residencia', 'comprovacao_vinculo'
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_arquivo BIGINT,
  tipo_mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for colaborador_documentos
ALTER TABLE public.colaborador_documentos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for colaborador_documentos
CREATE POLICY "Authenticated users can view documents"
ON public.colaborador_documentos
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert documents"
ON public.colaborador_documentos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents"
ON public.colaborador_documentos
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents"
ON public.colaborador_documentos
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_colaborador_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_colaborador_documentos_updated_at
  BEFORE UPDATE ON public.colaborador_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_colaborador_documentos_updated_at();