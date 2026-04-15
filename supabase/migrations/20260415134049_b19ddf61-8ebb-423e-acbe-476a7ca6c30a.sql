CREATE TABLE public.guarantee_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  external_id INTEGER,
  document_number INTEGER,
  main_document_number INTEGER,
  main_policy_number TEXT,
  policyholder_name TEXT,
  policyholder_document TEXT,
  insured_name TEXT,
  insured_document TEXT,
  modality TEXT,
  submodality TEXT,
  document_type TEXT,
  document_type_id INTEGER,
  duration_start TIMESTAMPTZ,
  duration_end TIMESTAMPTZ,
  duration_days INTEGER,
  premium_value NUMERIC,
  endorsement_secured_amount NUMERIC,
  broker_name TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'Ativo',
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guarantee_endorsements_external_id_user_id_unique UNIQUE (external_id, user_id)
);

ALTER TABLE public.guarantee_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own endorsements"
  ON public.guarantee_endorsements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own endorsements"
  ON public.guarantee_endorsements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own endorsements"
  ON public.guarantee_endorsements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own endorsements"
  ON public.guarantee_endorsements FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_guarantee_endorsements_updated_at
  BEFORE UPDATE ON public.guarantee_endorsements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();