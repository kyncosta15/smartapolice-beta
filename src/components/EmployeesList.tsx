// Lista de colaboradores do novo sistema

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  CreditCard,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Buscando colaboradores para:', user?.company);

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

      console.log('✅ Empresa encontrada:', empresaData);

      // Buscar colaboradores da empresa (tabela colaboradores)
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
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
        `)
        .eq('empresa_id', empresaData.id)
        .order('nome', { ascending: true });

      console.log('📊 Colaboradores encontrados:', colaboradoresData?.length || 0);
      console.log('❌ Erro (se houver):', colaboradoresError);

      if (colaboradoresError) {
        console.error('Erro ao buscar colaboradores:', colaboradoresError);
        return;
      }

      // Transform colaboradores data to match Employee interface
      const employeesWithCompanies = (colaboradoresData || []).map(colaborador => ({
        id: colaborador.id,
        cpf: colaborador.cpf,
        full_name: colaborador.nome,
        email: colaborador.email,
        phone: colaborador.telefone,
        birth_date: colaborador.data_nascimento,
        status: colaborador.status as 'ativo' | 'inativo' | 'pendente',
        created_at: colaborador.created_at,
        company_id: colaborador.empresa_id,
        companies: colaborador.empresas ? {
          id: colaborador.empresas.id,
          cnpj: colaborador.empresas.cnpj || '',
          legal_name: colaborador.empresas.nome,
          trade_name: colaborador.empresas.nome
        } : undefined,
        employee_plans: [], // TODO: Implementar se necessário
        dependents: colaborador.dependentes?.filter((dep: any) => dep.status === 'ativo').map((dep: any) => ({
          id: dep.id,
          full_name: dep.nome,
          relationship: dep.grau_parentesco
        })) || []
      }));

      console.log('✅ Colaboradores transformados:', employeesWithCompanies.length);
      setEmployees(employeesWithCompanies);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast({
        title: "Erro ao carregar colaboradores",
        description: "Não foi possível carregar os dados dos colaboradores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSelectedEmployees = async () => {
    if (selectedEmployees.size === 0) return;
    
    setIsDeleting(true);
    try {
      const employeeIds = Array.from(selectedEmployees);
      
      // Delete dependents first
      for (const employeeId of employeeIds) {
        await supabase
          .from('dependentes')
          .delete()
          .eq('colaborador_id', employeeId);
      }
      
      // Delete employees
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .in('id', employeeIds);

      if (error) throw error;

      toast({
        title: "Colaboradores excluídos",
        description: `${employeeIds.length} colaborador(es) foram excluídos com sucesso`,
      });

      setSelectedEmployees(new Set());
      await fetchEmployees();
    } catch (error) {
      console.error('Erro ao excluir colaboradores:', error);
      toast({
        title: "Erro ao excluir colaboradores",
        description: "Não foi possível excluir os colaboradores selecionados",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
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
    employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.cpf?.includes(searchTerm) ||
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
      {/* Header com busca e ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Colaboradores Cadastrados</h3>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-muted-foreground">
                {employees.length} colaboradores • {employees.filter(emp => emp.status === 'ativo').length} ativos • {employees.filter(emp => emp.status !== 'ativo').length} inativos
              </p>
              <p className="text-xs text-muted-foreground">
                {employees.reduce((total, emp) => total + emp.dependents.length, 0)} dependentes cadastrados
                {searchTerm && ` • ${filteredEmployees.length} resultados na busca`}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          {/* Botão de exclusão */}
          {selectedEmployees.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir ({selectedEmployees.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedEmployees.size} colaborador(es)? 
                    Esta ação não pode ser desfeita e também excluirá todos os dependentes associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteSelectedEmployees}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Controle de seleção */}
      {filteredEmployees.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
            onCheckedChange={toggleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            {selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0
              ? 'Desmarcar todos'
              : 'Selecionar todos'
            }
          </label>
          {selectedEmployees.size > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedEmployees.size} selecionado{selectedEmployees.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

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
            <Card key={employee.id} className={`hover:shadow-md transition-all ${selectedEmployees.has(employee.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  {/* Checkbox de seleção */}
                  <Checkbox
                    checked={selectedEmployees.has(employee.id)}
                    onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                    className="mt-1"
                  />
                  
                  <div className="space-y-2 flex-1">
                    {/* Nome, CPF e Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold text-lg">{employee.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            CPF: {formatCPF(employee.cpf)}
                          </p>
                        </div>
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
                        <div className="space-y-1">
                          {employee.dependents.map((dependent, index) => (
                            <div key={dependent.id} className="text-sm text-muted-foreground">
                              • {dependent.full_name} ({dependent.relationship})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          // TODO: Implementar edição do colaborador
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};