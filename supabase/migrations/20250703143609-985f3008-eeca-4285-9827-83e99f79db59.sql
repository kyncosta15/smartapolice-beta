-- Fix security vulnerabilities

-- 1. Enable RLS on installments table if not already enabled
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- 2. Create comprehensive RLS policies for installments table
CREATE POLICY "Users can view their own installments" 
ON public.installments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create installments for their own policies" 
ON public.installments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM public.policies WHERE id = policy_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update their own installments" 
ON public.installments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installments" 
ON public.installments 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Fix the overly permissive INSERT policy on policies table
DROP POLICY IF EXISTS "Users can insert new policies" ON public.policies;

CREATE POLICY "Users can insert their own policies" 
ON public.policies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Make user_id columns NOT NULL to prevent security bypass
-- First, update any existing NULL values to a default (this shouldn't happen with proper auth)
UPDATE public.policies SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE public.installments SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE public.policies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.installments ALTER COLUMN user_id SET NOT NULL;

-- 5. Add foreign key constraints for referential integrity
ALTER TABLE public.installments 
ADD CONSTRAINT fk_installments_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.installments 
ADD CONSTRAINT fk_installments_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE;

ALTER TABLE public.policies 
ADD CONSTRAINT fk_policies_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;