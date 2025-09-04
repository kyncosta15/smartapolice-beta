import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  ExternalLink,
  User,
  Building,
  CreditCard,
  UserPlus,
  Eye,
  Edit
} from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { EmployeeForm } from '@/components/EmployeeForm';
import { EmployeeDetailsDrawer } from '@/components/EmployeeDetailsDrawer';
import { debounce } from 'lodash';

export default function RHColaboradores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  const { 
    employees, 
    plans, 
    companies, 
    isLoading, 
    error, 
    createEmployee,
    searchEmployees
  } = useCollaborators();

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      searchEmployees(term);
    }, 300),
    [searchEmployees]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getCurrentPlan = (employee: any) => {
    return employee.employee_plans?.find((plan: any) => 
      plan.status === 'ativo' && !plan.end_date
    );
  };

  const getDependentsCount = (employee: any) => {
    return employee.dependents?.filter((dep: any) => dep.status === 'ativo' || !dep.status).length || 0;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Colaboradores Cadastrados</h1>
          <p className="text-muted-foreground">Gestão de colaboradores e benefícios</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      {/* Novo Colaborador Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Novo Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <EmployeeForm
              plans={plans}
              companies={companies}
              onSubmit={async (data: any) => {
                await createEmployee(data);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Colaborador
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grid de Colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : employees.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum colaborador cadastrado</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 
                    'Nenhum colaborador encontrado com os critérios de busca.' :
                    'Comece cadastrando o primeiro colaborador usando o formulário acima.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          employees.map((employee) => {
            const currentPlan = getCurrentPlan(employee);
            const dependentsCount = getDependentsCount(employee);
            
            return (
              <Card key={employee.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Nome e CPF */}
                    <div>
                      <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        CPF: {formatCPF(employee.cpf)}
                      </p>
                    </div>

                    {/* Empresa */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {employee.companies?.trade_name || employee.companies?.legal_name}
                        </p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs text-blue-600"
                          onClick={() => {
                            // Navigate to company page
                            window.open(`/rh/empresas/${employee.company_id}`, '_blank');
                          }}
                        >
                          {formatCNPJ(employee.companies?.cnpj || '')}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {/* Plano */}
                    {currentPlan && (
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {currentPlan.plans.name}
                        </Badge>
                        <p className="text-sm font-medium">
                          R$ {Number(currentPlan.monthly_premium).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} /mês
                        </p>
                      </div>
                    )}

                    {/* Dependentes */}
                    <p className="text-sm text-muted-foreground">
                      Dependentes: {dependentsCount}
                    </p>

                    {/* Ações */}
                    <div className="flex gap-2">
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
                            onClick={() => setSelectedEmployee(employee.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-2xl">
                          {selectedEmployee === employee.id && (
                            <EmployeeDetailsDrawer 
                              employeeId={selectedEmployee}
                              onClose={() => setSelectedEmployee(null)}
                            />
                          )}
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}