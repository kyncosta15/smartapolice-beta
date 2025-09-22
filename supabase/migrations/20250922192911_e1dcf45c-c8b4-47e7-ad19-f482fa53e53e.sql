-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS is_member_of(uuid);

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION is_member_of(target_empresa_id uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_memberships 
    WHERE user_id = auth.uid() 
      AND empresa_id = target_empresa_id
  );
$$;