-- Fix RLS policy: Allow all authenticated users to READ webhook configs
-- Only admins should be able to UPDATE/INSERT

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view webhook configs" ON public.n8n_webhooks_config;

-- Create new SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view webhook configs" 
ON public.n8n_webhooks_config 
FOR SELECT 
USING (auth.role() = 'authenticated');
