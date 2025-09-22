-- Fix infinite recursion in user_memberships RLS policies
-- Drop existing policies that may be causing recursion
DROP POLICY IF EXISTS "user_memberships_select" ON user_memberships;
DROP POLICY IF EXISTS "user_memberships_insert" ON user_memberships;
DROP POLICY IF EXISTS "user_memberships_update" ON user_memberships;
DROP POLICY IF EXISTS "user_memberships_delete" ON user_memberships;

-- Create simple, non-recursive policies for user_memberships
CREATE POLICY "user_memberships_select" ON user_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_memberships_insert" ON user_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_memberships_update" ON user_memberships
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_memberships_delete" ON user_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Also fix the is_member_of function to be more efficient and avoid potential recursion
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