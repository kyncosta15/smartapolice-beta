-- Fix users table RLS policies to allow current_empresa_id function to work
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create proper policies for users table
CREATE POLICY "Users can read their own data" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Allow authenticated users to read basic user info for functions
CREATE POLICY "Authenticated users can read basic user info for functions"
ON public.users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Ensure user_memberships table allows proper access
DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_memberships;

CREATE POLICY "Users can view their memberships"
ON public.user_memberships FOR SELECT
USING (auth.uid() = user_id);