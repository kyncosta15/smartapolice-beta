-- 1. CASCADE constraints para integridade referencial
ALTER TABLE IF EXISTS public.dependents
  DROP CONSTRAINT IF EXISTS dependents_employee_id_fkey,
  ADD CONSTRAINT dependents_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.employee_plans
  DROP CONSTRAINT IF EXISTS employee_plans_employee_id_fkey,
  ADD CONSTRAINT employee_plans_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 2. Habilitar RLS nas tabelas principais
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employee_plans ENABLE ROW LEVEL SECURITY;

-- 3. RPC para somar custos dos employee_plans
CREATE OR REPLACE FUNCTION sum_employee_premiums(p_company_id UUID DEFAULT NULL)
RETURNS TABLE(total NUMERIC)
LANGUAGE SQL AS $$
  SELECT COALESCE(SUM(ep.monthly_premium), 0)::NUMERIC AS total
  FROM employee_plans ep
  JOIN employees e ON e.id = ep.employee_id
  WHERE ep.status = 'ativo' 
    AND e.status = 'ativo'
    AND (p_company_id IS NULL OR e.company_id = p_company_id);
$$;

-- 4. Configurar realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dependents;