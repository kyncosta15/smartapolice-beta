ALTER TABLE public.guarantee_policies 
ADD CONSTRAINT guarantee_policies_external_id_user_id_unique UNIQUE (external_id, user_id);