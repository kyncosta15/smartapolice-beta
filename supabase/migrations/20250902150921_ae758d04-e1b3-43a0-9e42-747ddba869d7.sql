-- Criar tabela para metadados dos arquivos de planilha
CREATE TABLE public.planilhas_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT NOT NULL,
  caminho_storage TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processando',
  colaboradores_importados INTEGER DEFAULT 0,
  dependentes_importados INTEGER DEFAULT 0,
  data_upload TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_processamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT planilhas_uploads_status_check CHECK (status IN ('processando', 'processado', 'erro', 'cancelado'))
);

-- Enable Row Level Security
ALTER TABLE public.planilhas_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for planilhas_uploads
CREATE POLICY "Users can view their own planilha uploads" 
ON public.planilhas_uploads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own planilha uploads" 
ON public.planilhas_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planilha uploads" 
ON public.planilhas_uploads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planilha uploads" 
ON public.planilhas_uploads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_planilhas_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_planilhas_uploads_updated_at
BEFORE UPDATE ON public.planilhas_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_planilhas_uploads_updated_at();

-- Add foreign key constraint to empresa
ALTER TABLE public.planilhas_uploads 
ADD CONSTRAINT planilhas_uploads_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE SET NULL;