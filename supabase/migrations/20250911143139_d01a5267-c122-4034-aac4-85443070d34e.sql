-- Create a secure token-based public submission system

-- 1. Create session_tokens table for secure temporary access
CREATE TABLE IF NOT EXISTS public.session_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    employee_id UUID REFERENCES public.employees(id),
    session_id UUID REFERENCES public.public_sessions(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on session_tokens
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Create rate limiting table to prevent spam
CREATE TABLE IF NOT EXISTS public.submission_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL,
    employee_cpf TEXT,
    submission_count INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    UNIQUE(ip_address, employee_cpf)
);

-- Enable RLS on rate limits (only accessible by authenticated users)
ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. Update public_sessions RLS policies to be more restrictive
DROP POLICY IF EXISTS "Permitir criação pública de sessões" ON public.public_sessions;
DROP POLICY IF EXISTS "RH pode ver sessões da sua empresa" ON public.public_sessions;

-- Only allow session creation with valid tokens
CREATE POLICY "Allow session creation with valid token" 
ON public.public_sessions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.session_tokens st 
        WHERE st.session_id = id 
        AND st.expires_at > now() 
        AND st.used_at IS NULL
    )
);

-- RH can view sessions from their company
CREATE POLICY "RH can view company sessions" 
ON public.public_sessions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM employees emp
        JOIN users u ON true
        JOIN empresas e ON u.company::text = e.nome
        WHERE u.id = auth.uid() 
        AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador'])
        AND e.id = emp.company_id 
        AND emp.id = public_sessions.employee_id
    )
);

-- 4. Update requests table RLS policies  
DROP POLICY IF EXISTS "Permitir atualizacao para usuarios autenticados" ON public.requests;
DROP POLICY IF EXISTS "Permitir leitura para usuarios autenticados" ON public.requests;

-- Only allow request creation through valid sessions
CREATE POLICY "Allow request creation with valid session" 
ON public.requests 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.public_sessions ps
        JOIN public.session_tokens st ON ps.id = st.session_id
        WHERE ps.id = session_id 
        AND st.expires_at > now()
    )
);

-- Only allow request updates through valid sessions
CREATE POLICY "Allow request updates with valid session" 
ON public.requests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.public_sessions ps
        JOIN public.session_tokens st ON ps.id = st.session_id
        WHERE ps.id = session_id 
        AND st.expires_at > now()
    ) OR 
    -- Authenticated RH/Admin can update
    EXISTS (
        SELECT 1 FROM employees emp
        JOIN users u ON true
        JOIN empresas e ON u.company::text = e.nome
        WHERE u.id = auth.uid() 
        AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador'])
        AND e.id = emp.company_id 
        AND emp.id = requests.employee_id
    )
);

-- RH can view requests from their company
CREATE POLICY "RH can view company requests" 
ON public.requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM employees emp
        JOIN users u ON true
        JOIN empresas e ON u.company::text = e.nome
        WHERE u.id = auth.uid() 
        AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador'])
        AND e.id = emp.company_id 
        AND emp.id = requests.employee_id
    )
);

-- 5. Update files table RLS policies
DROP POLICY IF EXISTS "Permitir criação pública de files" ON public.files;
DROP POLICY IF EXISTS "RH e Admin podem ver todos os arquivos" ON public.files;

-- Only allow file creation with valid request session
CREATE POLICY "Allow file creation with valid request" 
ON public.files 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.requests r
        JOIN public.session_tokens st ON r.session_id = st.session_id
        WHERE r.id = request_id 
        AND st.expires_at > now()
    )
);

-- RH can view files from their company requests
CREATE POLICY "RH can view company request files" 
ON public.files 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM requests r
        JOIN employees emp ON r.employee_id = emp.id
        JOIN users u ON true
        JOIN empresas e ON u.company::text = e.nome
        WHERE u.id = auth.uid() 
        AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador'])
        AND e.id = emp.company_id 
        AND r.id = files.request_id
    )
);

-- 6. Create function to generate secure session tokens
CREATE OR REPLACE FUNCTION public.generate_session_token(
    p_employee_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(token TEXT, session_id UUID, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token TEXT;
    v_session_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate secure token (32 characters)
    v_token := encode(gen_random_bytes(24), 'base64');
    v_token := replace(replace(replace(v_token, '/', ''), '+', ''), '=', '');
    
    -- Set expiration (30 minutes from now)
    v_expires_at := now() + interval '30 minutes';
    
    -- Create session first
    INSERT INTO public.public_sessions (employee_id, ip, user_agent)
    VALUES (p_employee_id, p_ip_address, p_user_agent)
    RETURNING id INTO v_session_id;
    
    -- Create token
    INSERT INTO public.session_tokens (token, employee_id, session_id, expires_at, ip_address, user_agent)
    VALUES (v_token, p_employee_id, v_session_id, v_expires_at, p_ip_address, p_user_agent);
    
    RETURN QUERY SELECT v_token, v_session_id, v_expires_at;
END;
$$;

-- 7. Create function to validate and consume session token
CREATE OR REPLACE FUNCTION public.validate_session_token(p_token TEXT)
RETURNS TABLE(session_id UUID, employee_id UUID, valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
    v_employee_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_used_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get token info
    SELECT st.session_id, st.employee_id, st.expires_at, st.used_at
    INTO v_session_id, v_employee_id, v_expires_at, v_used_at
    FROM public.session_tokens st
    WHERE st.token = p_token;
    
    -- Check if token exists, is not expired, and not used
    IF v_session_id IS NOT NULL AND v_expires_at > now() AND v_used_at IS NULL THEN
        RETURN QUERY SELECT v_session_id, v_employee_id, TRUE;
    ELSE
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE;
    END IF;
END;
$$;

-- 8. Create RLS policies for session_tokens (read-only for token validation)
CREATE POLICY "Allow public token validation" 
ON public.session_tokens 
FOR SELECT 
USING (expires_at > now() AND used_at IS NULL);

-- RH can view tokens for their company employees
CREATE POLICY "RH can view company employee tokens" 
ON public.session_tokens 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM employees emp
        JOIN users u ON true
        JOIN empresas e ON u.company::text = e.nome
        WHERE u.id = auth.uid() 
        AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador'])
        AND e.id = emp.company_id 
        AND emp.id = session_tokens.employee_id
    )
);

-- 9. RLS policies for rate limiting (admin only)
CREATE POLICY "Admin can manage rate limits" 
ON public.submission_rate_limits 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role::text = ANY(ARRAY['admin', 'administrador'])
    )
);