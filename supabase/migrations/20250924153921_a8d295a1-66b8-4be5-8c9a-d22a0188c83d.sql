-- Create public_fleet_tokens table for generating public fleet request links
CREATE TABLE IF NOT EXISTS public.public_fleet_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  empresa_id UUID NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_fleet_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their company tokens" 
ON public.public_fleet_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND e.id = public_fleet_tokens.empresa_id
  )
);

-- Allow public access for token validation (read only)
CREATE POLICY "Allow public token validation" 
ON public.public_fleet_tokens 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_public_fleet_tokens_updated_at
BEFORE UPDATE ON public.public_fleet_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();