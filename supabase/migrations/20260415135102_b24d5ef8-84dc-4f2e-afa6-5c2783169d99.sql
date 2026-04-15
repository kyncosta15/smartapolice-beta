
CREATE TABLE public.guarantee_policyholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  external_id INTEGER,
  federal_id TEXT,
  name TEXT,
  trade_name TEXT,
  economic_group TEXT,
  credit_limit NUMERIC,
  credit_limit_available NUMERIC,
  risk_rating TEXT,
  status TEXT DEFAULT 'Ativo',
  registration_date TEXT,
  address_city TEXT,
  address_state TEXT,
  segment TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT guarantee_policyholders_federal_id_user_id_unique UNIQUE (federal_id, user_id)
);

ALTER TABLE public.guarantee_policyholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own policyholders"
  ON public.guarantee_policyholders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policyholders"
  ON public.guarantee_policyholders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policyholders"
  ON public.guarantee_policyholders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_guarantee_policyholders_updated_at
  BEFORE UPDATE ON public.guarantee_policyholders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
