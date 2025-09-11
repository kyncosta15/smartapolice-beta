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
      console.log('🔍 Fetching employees with search:', search);
      
      // Verificar usuário atual
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('👤 Current user:', currentUser?.user?.id);
      
      let query = supabase
        .from('colaboradores')
        .select(`
          *,
          empresas(*),
          dependentes:dependentes(
            id,
            nome,
            cpf,
            data_nascimento,
            grau_parentesco,
            status
          )
        `);
      
      if (search) {
        query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`);
      }

      console.log('🔄 Executing query...');
      const { data: colaboradoresData, error } = await query.order('nome');

      console.log('📊 Raw colaboradores data:', colaboradoresData);
      console.log('📊 Data length:', colaboradoresData?.length || 0);
      console.log('❌ Error (if any):', error);

      if (error) throw error;

      // Transform colaboradores data to match Employee interface
      const employees = colaboradoresData?.map(colaborador => ({
        id: colaborador.id,
        company_id: colaborador.empresa_id,
        cpf: colaborador.cpf,
        full_name: colaborador.nome,
        email: colaborador.email,
        phone: colaborador.telefone,
        birth_date: colaborador.data_nascimento,
        status: colaborador.status,
        companies: colaborador.empresas ? {
          id: colaborador.empresas.id,
          cnpj: colaborador.empresas.cnpj || '',
          legal_name: colaborador.empresas.nome,
          trade_name: colaborador.empresas.nome
        } : undefined,
        employee_plans: [], // TODO: Implementar se necessário
        dependents: colaborador.dependentes?.filter((dep: any) => dep.status === 'ativo').map((dep: any) => ({
          id: dep.id,
          employee_id: colaborador.id,
          full_name: dep.nome,
          cpf: dep.cpf,
          birth_date: dep.data_nascimento,
          relationship: dep.grau_parentesco,
          status: dep.status
        })) || []
      })) || [];

      console.log('✅ Transformed employees:', employees);
      setEmployees(employees);
    } catch (err) {
      console.error('❌ Error fetching employees:', err);
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
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;
      
      // Transform empresas data to match Company interface
      const companiesData = data?.map(empresa => ({
        id: empresa.id,
        cnpj: empresa.cnpj || '',
        legal_name: empresa.nome,
        trade_name: empresa.nome
      })) || [];
      
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Erro ao carregar empresas');
    }
  };

  const createEmployee = async (employeeData: CreateEmployeeData & { documents?: File[] }) => {
    try {
      console.log('🚀 Creating employee with data:', employeeData);
      
      // Buscar empresa do usuário atual
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: userInfo } = await supabase
        .from('users')
        .select('company')
        .eq('id', currentUser.user.id)
        .single();

      if (!userInfo?.company) {
        throw new Error('Usuário não possui empresa associada');
      }

      console.log('✅ User company:', userInfo.company);

      // Buscar ou criar empresa na tabela empresas
      let { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userInfo.company)
        .single();

      if (!empresa) {
        console.log('🔄 Creating empresa entry...');
        const { data: newEmpresa, error: empresaError } = await supabase
          .from('empresas')
          .insert({
            nome: userInfo.company,
            cnpj: employeeData.company.cnpj
          })
          .select()
          .single();

        if (empresaError) {
          console.error('❌ Error creating empresa:', empresaError);
          throw empresaError;
        }
        
        empresa = newEmpresa;
      }

      console.log('✅ Using empresa:', empresa);

      // Criar o colaborador diretamente na tabela colaboradores (não employees)
      console.log('🔄 Creating colaborador...');
      const { data: newColaborador, error: colaboradorError } = await supabase
        .from('colaboradores')
        .insert({
          empresa_id: empresa.id,
          cpf: employeeData.cpf.replace(/\D/g, ''),
          nome: employeeData.fullName,
          email: employeeData.email,
          telefone: employeeData.phone,
          data_nascimento: employeeData.birthDate,
          status: 'ativo'
        })
        .select()
        .single();

      if (colaboradorError) {
        console.error('❌ Error creating colaborador:', colaboradorError);
        throw colaboradorError;
      }

      console.log('✅ Created colaborador:', newColaborador);

      // Upload documents if provided
      if (employeeData.documents && employeeData.documents.length > 0) {
        console.log('📎 Uploading documents...');
        
        for (const file of employeeData.documents) {
          const fileName = `${newColaborador.id}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('smartbeneficios')
            .upload(fileName, file);

          if (uploadError) {
            console.error('❌ Error uploading file:', uploadError);
          } else {
            console.log('✅ Uploaded file:', fileName);
          }
        }
      }

      // Se há plano inicial, criar o vínculo (adaptar para colaboradores se necessário)
      if (employeeData.initialPlan) {
        console.log('🔄 Creating employee plan...');
        // Note: Pode precisar ajustar esta parte dependendo da estrutura das tabelas
        console.log('⚠️ Initial plan creation not implemented for colaboradores table yet');
      }

      toast({ title: 'Colaborador criado com sucesso!' });
      await fetchEmployees();
      return newColaborador;
    } catch (err) {
      console.error('❌ Error creating employee:', err);
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
      const { data: currentUserData } = await supabase.auth.getUser();
      console.log('👤 Current user:', currentUserData.user?.id);
      console.log('🔄 Executing query...');
      
      const { data: colaboradorData, error } = await supabase
        .from('colaboradores')
        .select(`
          *,
          empresas!inner(
            id,
            nome,
            cnpj
          ),
          dependentes(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      console.log('📊 Raw colaboradores data:', [colaboradorData]);
      console.log('📊 Data length:', colaboradorData ? 1 : 0);
      console.log('❌ Error (if any):', error);

      // Transform colaborador data to match Employee interface
      const transformedEmployee: Employee = {
        id: colaboradorData.id,
        company_id: colaboradorData.empresa_id,
        cpf: colaboradorData.cpf,
        full_name: colaboradorData.nome,
        email: colaboradorData.email,
        phone: colaboradorData.telefone,
        birth_date: colaboradorData.data_nascimento,
        status: colaboradorData.status,
        companies: {
          id: colaboradorData.empresas.id,
          cnpj: colaboradorData.empresas.cnpj,
          legal_name: colaboradorData.empresas.nome,
          trade_name: colaboradorData.empresas.nome
        },
        employee_plans: [], // TODO: Implement if needed
        dependents: colaboradorData.dependentes?.map((dep: any) => ({
          id: dep.id,
          employee_id: colaboradorData.id,
          full_name: dep.nome,
          cpf: dep.cpf,
          birth_date: dep.data_nascimento,
          relationship: dep.grau_parentesco,
          created_at: dep.created_at
        })) || []
      };

      console.log('✅ Transformed employee:', transformedEmployee);
      return transformedEmployee;
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar colaborador');
      return null;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      // Map Employee interface fields to colaboradores table fields
      const colaboradorUpdates: any = {};
      
      if (updates.full_name) colaboradorUpdates.nome = updates.full_name;
      if (updates.email) colaboradorUpdates.email = updates.email;
      if (updates.phone) colaboradorUpdates.telefone = updates.phone;
      if (updates.birth_date) colaboradorUpdates.data_nascimento = updates.birth_date;
      if (updates.status) colaboradorUpdates.status = updates.status;
      if (updates.cpf) colaboradorUpdates.cpf = updates.cpf;

      const { error } = await supabase
        .from('colaboradores')
        .update(colaboradorUpdates)
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
        .from('dependentes')
        .insert({
          colaborador_id: employeeId,
          nome: dependent.full_name,
          cpf: dependent.cpf?.replace(/\D/g, ''),
          data_nascimento: dependent.birth_date,
          grau_parentesco: dependent.relationship as any,
          status: 'ativo'
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
    { table: 'colaboradores' },
    { table: 'dependentes' },
    { table: 'empresas' }
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