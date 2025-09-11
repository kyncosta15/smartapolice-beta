-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the generate_session_token function to ensure it works correctly
DROP FUNCTION IF EXISTS generate_session_token(uuid, inet, text);

CREATE OR REPLACE FUNCTION generate_session_token(
  p_employee_id uuid,
  p_ip_address inet,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE (
  token text,
  session_id uuid,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_session_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Generate secure token using pgcrypto
  v_token := encode(gen_random_bytes(24), 'base64');
  v_session_id := gen_random_uuid();
  v_expires_at := now() + interval '7 days';
  
  -- Insert session token
  INSERT INTO session_tokens (
    token,
    employee_id,
    session_id,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    v_token,
    p_employee_id,
    v_session_id,
    v_expires_at,
    p_ip_address,
    p_user_agent
  );
  
  -- Return the generated values
  RETURN QUERY SELECT v_token, v_session_id, v_expires_at;
END;
$$;