-- Fix security vulnerabilities (corrected approach)

-- 1. First, clean up any invalid data (policies/installments without valid user_id)
DELETE FROM public.installments WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.policies WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM auth.users);

-- 2. Enable RLS on installments table if not already enabled
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- 3. Create comprehensive RLS policies for installments table
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

-- 4. Fix the overly permissive INSERT policy on policies table
DROP POLICY IF EXISTS "Users can insert new policies" ON public.policies;

CREATE POLICY "Users can insert their own policies" 
ON public.policies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Make user_id columns NOT NULL to prevent security bypass
ALTER TABLE public.policies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.installments ALTER COLUMN user_id SET NOT NULL;

-- 6. Add foreign key constraints for referential integrity
ALTER TABLE public.policies 
ADD CONSTRAINT fk_policies_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.installments 
ADD CONSTRAINT fk_installments_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.installments 
ADD CONSTRAINT fk_installments_policy_id 
FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE;