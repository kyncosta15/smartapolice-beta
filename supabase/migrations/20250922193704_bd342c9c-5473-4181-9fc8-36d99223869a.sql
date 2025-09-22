-- Add missing column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS default_empresa_id uuid REFERENCES empresas(id);

-- Create user_memberships table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS user_memberships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member')) DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, empresa_id)
);

-- Enable RLS on user_memberships
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple policies for user_memberships (avoid recursion)
CREATE POLICY "user_memberships_own" ON user_memberships
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create membership for existing user to RCaldas empresa
INSERT INTO user_memberships (user_id, empresa_id, role)
VALUES (
  'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3',
  '276bb418-bedd-4c23-9729-2716b55c9a7b', 
  'admin'
) ON CONFLICT (user_id, empresa_id) DO UPDATE SET role = 'admin';

-- Update user profile to set default empresa
UPDATE user_profiles 
SET default_empresa_id = '276bb418-bedd-4c23-9729-2716b55c9a7b'
WHERE id = 'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3';