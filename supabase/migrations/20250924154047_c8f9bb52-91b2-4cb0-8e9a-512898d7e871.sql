-- Create user_memberships table to fix the infinite recursion issue
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- Enable RLS
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- Create safe policies that won't cause infinite recursion
CREATE POLICY "Users can view their own memberships" 
ON public.user_memberships 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage memberships" 
ON public.user_memberships 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'administrador', 'corretora_admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_user_memberships_updated_at
BEFORE UPDATE ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the is_member_of function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_member_of(record_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- First check direct company matching via users table
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1
      FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() AND e.id = record_empresa_id
    ) THEN true
    -- Then check memberships table without causing recursion
    WHEN EXISTS (
      SELECT 1
      FROM user_memberships m
      WHERE m.user_id = auth.uid() AND m.empresa_id = record_empresa_id
    ) THEN true
    ELSE false
  END;
$$;