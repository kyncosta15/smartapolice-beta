-- First, let's enable RLS on user_memberships if not already enabled
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Add simple policies for user_memberships to prevent infinite recursion
-- These policies only allow users to see their own memberships
CREATE POLICY IF NOT EXISTS "user_memberships_select" ON user_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_memberships_insert" ON user_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_memberships_update" ON user_memberships
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "user_memberships_delete" ON user_memberships
  FOR DELETE USING (user_id = auth.uid());