ALTER TABLE public.guarantee_billings 
ADD CONSTRAINT guarantee_billings_external_id_user_id_unique UNIQUE (external_id, user_id);