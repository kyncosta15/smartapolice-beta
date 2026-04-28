ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS renovado_nosnum integer,
  ADD COLUMN IF NOT EXISTS renovado_codfil integer,
  ADD COLUMN IF NOT EXISTS sit_renovacao integer,
  ADD COLUMN IF NOT EXISTS sit_renovacao_txt text;

CREATE INDEX IF NOT EXISTS idx_policies_renovado_nosnum
  ON public.policies (user_id, renovado_codfil, renovado_nosnum)
  WHERE renovado_nosnum IS NOT NULL;