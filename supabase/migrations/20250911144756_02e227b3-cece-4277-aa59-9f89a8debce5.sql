-- Create submission rate limits table for security
CREATE TABLE public.submission_rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempts INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow insert for rate limiting" 
ON public.submission_rate_limits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow select for rate limiting validation" 
ON public.submission_rate_limits 
FOR SELECT 
USING (true);

-- Create index for performance
CREATE INDEX idx_submission_rate_limits_ip_created ON public.submission_rate_limits(ip_address, created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_submission_rate_limits_updated_at
    BEFORE UPDATE ON public.submission_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update colaborador_submissoes table to include new document fields
ALTER TABLE public.colaborador_submissoes 
ADD COLUMN IF NOT EXISTS documentos_anexados JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON TABLE public.submission_rate_limits IS 'Rate limiting table to prevent spam submissions';
COMMENT ON COLUMN public.submission_rate_limits.ip_address IS 'IP address of the submitter';
COMMENT ON COLUMN public.submission_rate_limits.attempts IS 'Number of attempts from this IP';
COMMENT ON COLUMN public.colaborador_submissoes.documentos_anexados IS 'Array of attached documents with type and storage path';