import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  cnpj: string;
  legal_name: string;
  trade_name?: string;
}

interface Plan {
  id: string;
  name: string;
  type: string;
  operator: string;
  base_monthly_cost?: number;
}

interface EmployeePlan {
  id: string;
  plan_id: string;
  start_date: string;
  end_date?: string;
  status: string;
  monthly_premium: number;
  plans: Plan;
}

interface Dependent {
  id: string;
  employee_id: string;
  full_name: string;
  cpf?: string;
  birth_date?: string;
  relationship?: string;
  status?: string;
}

interface Employee {
  id: string;
  company_id?: string;
  cpf: string;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  status: string;
  companies?: Company;
  employee_plans?: EmployeePlan[];
  dependents?: Dependent[];
}

interface CreateEmployeeData {
  fullName: string;
  cpf: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  company: {
    cnpj: string;
    tradeName?: string;
    legalName: string;
  };
  initialPlan?: {
    planId: string;
    monthlyPremium: number;
    startDate: string;
  };
}

export function useCollaborators() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (search?: string) => {
    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          employee_plans(
            *,
            plans(*)
          ),
          dependents(*)
        `)
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: employeesData, error } = await query.order('full_name');

      if (error) throw error;

      // Fetch companies separately and merge
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*');

      const employeesWithCompanies = employeesData?.map(employee => ({
        ...employee,
        companies: companiesData?.find(company => company.id === employee.company_id)
      })) || [];

      setEmployees(employeesWithCompanies);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Erro ao carregar colaboradores');
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Erro ao carregar planos');
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('trade_name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Erro ao carregar empresas');
    }
  };

  const createEmployee = async (employeeData: CreateEmployeeData) => {
    try {
      // Primeiro, verificar se a empresa já existe ou criar uma nova
      let company = companies.find(c => c.cnpj === employeeData.company.cnpj);
      
      if (!company) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            cnpj: employeeData.company.cnpj,
            legal_name: employeeData.company.legalName,
            trade_name: employeeData.company.tradeName
          })
          .select()
          .single();

        if (companyError) throw companyError;
        company = newCompany;
      }

      // Criar o colaborador
      const { data: newEmployee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          company_id: company.id,
          cpf: employeeData.cpf.replace(/\D/g, ''),
          full_name: employeeData.fullName,
          email: employeeData.email,
          phone: employeeData.phone,
          birth_date: employeeData.birthDate,
          status: 'ativo'
        })
        .select()
        .single();

      if (employeeError) throw employeeError;

      // Se há plano inicial, criar o vínculo
      if (employeeData.initialPlan) {
        const { error: planError } = await supabase
          .from('employee_plans')
          .insert({
            employee_id: newEmployee.id,
            plan_id: employeeData.initialPlan.planId,
            start_date: employeeData.initialPlan.startDate,
            monthly_premium: employeeData.initialPlan.monthlyPremium,
            status: 'ativo'
          });

        if (planError) throw planError;
      }

      toast({ title: 'Colaborador criado com sucesso!' });
      await fetchEmployees();
      return newEmployee;
    } catch (err) {
      console.error('Error creating employee:', err);
      toast({
        title: 'Erro ao criar colaborador',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const getEmployee = async (id: string): Promise<Employee | null> => {
    try {
      const { data: employeeData, error } = await supabase
        .from('employees')
        .select(`
          *,
          employee_plans(
            *,
            plans(*)
          ),
          dependents(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch company separately
      let company = null;
      if (employeeData.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', employeeData.company_id)
          .single();
        company = companyData;
      }

      return {
        ...employeeData,
        companies: company
      };
    } catch (err) {
      console.error('Error fetching employee:', err);
      return null;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Colaborador atualizado com sucesso!' });
      await fetchEmployees();
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({
        title: 'Erro ao atualizar colaborador',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const createDependent = async (employeeId: string, dependent: Omit<Dependent, 'id' | 'employee_id'>) => {
    try {
      const { error } = await supabase
        .from('dependents')
        .insert({
          employee_id: employeeId,
          ...dependent
        });

      if (error) throw error;

      toast({ title: 'Dependente adicionado com sucesso!' });
      await fetchEmployees();
    } catch (err) {
      console.error('Error creating dependent:', err);
      toast({
        title: 'Erro ao adicionar dependente',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateDependent = async (id: string, updates: Partial<Dependent>) => {
    try {
      const { error } = await supabase
        .from('dependents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Dependente atualizado com sucesso!' });
      await fetchEmployees();
    } catch (err) {
      console.error('Error updating dependent:', err);
      toast({
        title: 'Erro ao atualizar dependente',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const deleteDependent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dependents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Dependente removido com sucesso!' });
      await fetchEmployees();
    } catch (err) {
      console.error('Error deleting dependent:', err);
      toast({
        title: 'Erro ao remover dependente',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const loadData = async (search?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchEmployees(search),
        fetchPlans(),
        fetchCompanies()
      ]);
    } catch (err) {
      console.error('Error loading collaborators data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Realtime subscriptions
  useRealtime(loadData, [
    { table: 'employees' },
    { table: 'dependents' },
    { table: 'employee_plans' },
    { table: 'companies' }
  ]);

  return {
    employees,
    plans,
    companies,
    isLoading,
    error,
    createEmployee,
    getEmployee,
    updateEmployee,
    createDependent,
    updateDependent,
    deleteDependent,
    searchEmployees: (search: string) => loadData(search),
    refetch: () => loadData()
  };
}