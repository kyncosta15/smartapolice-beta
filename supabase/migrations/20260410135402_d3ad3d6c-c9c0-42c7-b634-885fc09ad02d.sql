
-- guarantee_settings: integration configuration
CREATE TABLE public.guarantee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_connection_test TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.guarantee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own guarantee settings"
  ON public.guarantee_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_guarantee_settings_updated_at
  BEFORE UPDATE ON public.guarantee_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- guarantee_auth_sessions: token tracking
CREATE TABLE public.guarantee_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guarantee_auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own auth sessions"
  ON public.guarantee_auth_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own auth sessions"
  ON public.guarantee_auth_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- guarantee_billings: cached billing data
CREATE TABLE public.guarantee_billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT,
  policy_number TEXT,
  document_number TEXT,
  installment_number INT,
  booklet_number TEXT,
  policyholder_name TEXT,
  policyholder_document TEXT,
  economic_group TEXT,
  modality TEXT,
  document_type TEXT,
  expiration_date DATE,
  original_expiration_date DATE,
  amount_due NUMERIC(15,2),
  amount_paid NUMERIC(15,2),
  discount NUMERIC(15,2),
  status TEXT,
  days_overdue INT,
  payment_date DATE,
  cancellation_date DATE,
  write_off_date DATE,
  bill_url TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guarantee_billings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own billings"
  ON public.guarantee_billings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_guarantee_billings_updated_at
  BEFORE UPDATE ON public.guarantee_billings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_guarantee_billings_user ON public.guarantee_billings(user_id);
CREATE INDEX idx_guarantee_billings_status ON public.guarantee_billings(status);
CREATE INDEX idx_guarantee_billings_expiration ON public.guarantee_billings(expiration_date);

-- guarantee_billing_sync_logs
CREATE TABLE public.guarantee_billing_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'manual' CHECK (sync_type IN ('manual', 'automatic')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  items_fetched INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  filters_used JSONB,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guarantee_billing_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sync logs"
  ON public.guarantee_billing_sync_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own sync logs"
  ON public.guarantee_billing_sync_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- guarantee_integration_logs
CREATE TABLE public.guarantee_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  endpoint TEXT,
  method TEXT DEFAULT 'GET',
  status_code INT,
  request_params JSONB,
  response_summary JSONB,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guarantee_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own integration logs"
  ON public.guarantee_integration_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own integration logs"
  ON public.guarantee_integration_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_guarantee_integration_logs_user ON public.guarantee_integration_logs(user_id);
CREATE INDEX idx_guarantee_integration_logs_action ON public.guarantee_integration_logs(action);
