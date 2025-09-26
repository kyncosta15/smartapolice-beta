-- Simply add the default_empresa_id column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS default_empresa_id UUID REFERENCES public.empresas(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_empresa 
ON public.user_profiles(default_empresa_id);