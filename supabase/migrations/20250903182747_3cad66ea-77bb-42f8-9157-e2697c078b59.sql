-- Add public_sessions table for tracking public request sessions
CREATE TABLE IF NOT EXISTS public.public_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  ip INET,
  user_agent TEXT
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_public_sessions_employee ON public_sessions(employee_id);

-- Add RLS policies for public_sessions
ALTER TABLE public.public_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public session creation
CREATE POLICY "Permitir criação pública de sessões" 
ON public.public_sessions 
FOR INSERT 
WITH CHECK (true);

-- RH can view sessions from their company
CREATE POLICY "RH pode ver sessões da sua empresa" 
ON public.public_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM employees emp
    JOIN users u ON true
    JOIN empresas e ON u.company::text = e.nome
    WHERE u.id = auth.uid() 
    AND (u.role::text = 'rh' OR u.role::text = 'admin')
    AND e.id = emp.company_id 
    AND emp.id = public_sessions.employee_id
  )
);

-- Add session_id to requests metadata for linking
ALTER TABLE requests ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public_sessions(id) ON DELETE SET NULL;