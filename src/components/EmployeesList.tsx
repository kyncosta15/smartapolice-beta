// Lista de colaboradores do novo sistema

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  User, 
  Users, 
  Search, 
  Mail,
  Phone,
  Calendar,
  Building,
  ExternalLink,
  Edit,
  Eye,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { EmployeeDetailsDrawer } from './EmployeeDetailsDrawer';

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
}

interface EmployeePlan {
  id: string;
  plan_id: string;
  monthly_premium: number;
  status: string;
  plans: Plan;
}

interface Employee {
  id: string;
  cpf: string;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  created_at: string;
  company_id: string;
  companies?: Company;
  employee_plans?: EmployeePlan[];
  dependents: {
    id: string;
    full_name: string;
    relationship: string;
  }[];
}

export const EmployeesList: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);

      // Buscar empresa do usuário
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user?.company)
        .single();

      if (empresaError || !empresaData) {
        console.log('Empresa não encontrada:', user?.company);
        return;
      }

      // Buscar colaboradores da empresa
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          employee_plans(
            id,
            plan_id,
            monthly_premium,
            status,
            plans(
              id,
              name,
              type,
              operator
            )
          ),
          dependents(
            id,
            full_name,
            relationship
          )
        `)
        .eq('company_id', empresaData.id)
        .order('full_name', { ascending: true });

      if (employeesError) {
        console.error('Erro ao buscar colaboradores:', employeesError);
        return;
      }

      // Buscar dados das empresas/companies separadamente
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*');

      // Combinar dados
      const employeesWithCompanies = (employeesData || []).map(emp => ({
        ...emp,
        status: emp.status as 'ativo' | 'inativo' | 'pendente',
        companies: companiesData?.find(company => company.id === emp.company_id)
      }));

      setEmployees(employeesWithCompanies);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company) {
      fetchEmployees();
    }
  }, [user?.company]);

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getCurrentPlan = (employee: Employee) => {
    return employee.employee_plans?.find(plan => 
      plan.status === 'ativo'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'inativo':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf.includes(searchTerm) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Colaboradores Cadastrados</h3>
          <p className="text-muted-foreground">
            {employees.length} colaborador{employees.length !== 1 ? 'es' : ''} cadastrado{employees.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Lista de colaboradores */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum colaborador cadastrado'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Os colaboradores aparecerão aqui quando cadastrados'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Nome e CPF */}
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold text-lg">{employee.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          CPF: {formatCPF(employee.cpf)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>

                    {/* CNPJ Vinculado */}
                    {employee.companies && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {employee.companies.trade_name || employee.companies.legal_name}
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs text-blue-600"
                            onClick={() => {
                              // Navigate to company page
                              window.open(`/empresas/${employee.company_id}`, '_blank');
                            }}
                          >
                            CNPJ: {formatCNPJ(employee.companies.cnpj)}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Plano do Colaborador */}
                    {(() => {
                      const currentPlan = getCurrentPlan(employee);
                      return currentPlan ? (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{currentPlan.plans.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {currentPlan.plans.operator} - R$ {Number(currentPlan.monthly_premium).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })} /mês
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-muted-foreground">Nenhum plano ativo</p>  
                        </div>
                      );
                    })()}

                    {/* Informações adicionais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                      {employee.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.email}</span>
                        </div>
                      )}
                      
                      {employee.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Dependentes */}
                    {employee.dependents.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Dependentes ({employee.dependents.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {employee.dependents.map((dependent) => (
                            <Badge key={dependent.id} variant="outline" className="text-xs">
                              {dependent.full_name} ({dependent.relationship})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar edição
                        console.log('Editar colaborador:', employee.id);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-3"
                          onClick={() => setSelectedEmployeeId(employee.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto max-h-screen">
                        <div className="h-full overflow-y-auto pb-6">
                          {selectedEmployeeId === employee.id && (
                            <EmployeeDetailsDrawer 
                              employeeId={selectedEmployeeId}
                              onClose={() => setSelectedEmployeeId(null)}
                            />
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};