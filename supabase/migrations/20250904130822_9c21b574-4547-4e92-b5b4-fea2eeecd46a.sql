-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  trade_name text,
  created_at timestamptz DEFAULT now()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL, -- saude|odonto|vida
  operator text NOT NULL,
  base_monthly_cost numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Update existing employees table structure if needed
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create employee_plans table for plan assignments
CREATE TABLE IF NOT EXISTS public.employee_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'ativo', -- ativo|suspenso|cancelado
  monthly_premium numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_emp_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_empplans_employee ON public.employee_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_empplans_enddate ON public.employee_plans(end_date);
CREATE INDEX IF NOT EXISTS idx_empplans_status ON public.employee_plans(status);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "RH can manage companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('rh', 'admin', 'administrador')
    )
  );

-- RLS Policies for plans
CREATE POLICY "RH can manage plans" ON public.plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('rh', 'admin', 'administrador')
    )
  );

-- RLS Policies for employee_plans
CREATE POLICY "RH can manage employee plans" ON public.employee_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('rh', 'admin', 'administrador')
    )
  );

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_plans;

-- Set replica identity for realtime
ALTER TABLE public.companies REPLICA IDENTITY FULL;
ALTER TABLE public.plans REPLICA IDENTITY FULL;
ALTER TABLE public.employee_plans REPLICA IDENTITY FULL;

-- Insert some sample data
INSERT INTO public.plans (name, type, operator, base_monthly_cost) VALUES
  ('Porto Saúde Empresarial', 'saude', 'Porto Seguro', 450.00),
  ('Porto Odonto Premium', 'odonto', 'Porto Seguro', 80.00),
  ('Vida Empresarial Plus', 'vida', 'Porto Seguro', 120.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.companies (cnpj, legal_name, trade_name) VALUES
  ('12345678000195', 'Empresa Exemplo LTDA', 'Exemplo Corp'),
  ('98765432000176', 'Tech Solutions S.A.', 'TechSol')
ON CONFLICT DO NOTHING;