
-- Tabela para apólices de garantia sincronizadas da Junto Seguros
CREATE TABLE public.guarantee_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id INTEGER,
  document_number INTEGER,
  policy_number TEXT,
  junto_policy_number TEXT,
  policyholder_name TEXT,
  policyholder_document TEXT,
  insured_name TEXT,
  insured_document TEXT,
  economic_group TEXT,
  modality TEXT,
  submodality TEXT,
  insured_amount NUMERIC DEFAULT 0,
  insured_amount_current NUMERIC DEFAULT 0,
  net_premium NUMERIC DEFAULT 0,
  total_premium NUMERIC DEFAULT 0,
  commission_value NUMERIC DEFAULT 0,
  issue_rate NUMERIC DEFAULT 0,
  duration_start DATE,
  duration_end DATE,
  duration_end_current DATE,
  duration_days INTEGER,
  issue_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  is_renewal BOOLEAN DEFAULT false,
  bill_url TEXT,
  document_url TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, external_id)
);

ALTER TABLE public.guarantee_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own guarantee policies"
  ON public.guarantee_policies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guarantee policies"
  ON public.guarantee_policies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guarantee policies"
  ON public.guarantee_policies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_guarantee_policies_updated_at
  BEFORE UPDATE ON public.guarantee_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_guarantee_policies_user_id ON public.guarantee_policies(user_id);
CREATE INDEX idx_guarantee_policies_policyholder_doc ON public.guarantee_policies(policyholder_document);
CREATE INDEX idx_guarantee_policies_status ON public.guarantee_policies(status);
