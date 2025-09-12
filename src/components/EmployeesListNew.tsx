// Lista de colaboradores com novo layout baseado na imagem referência

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building,
  Calendar,
  X,
  Eye,
  Plus
} from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { toast } from '@/hooks/use-toast';
import { EmployeeDetailsDrawer } from './EmployeeDetailsDrawer';
import { ColaboradorModal } from './ColaboradorModal';

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
  companies?: {
    legal_name: string;
    trade_name?: string;
  };
  dependents: {
    full_name: string;
    relationship: string;
  }[];
  // Campos adicionais do colaboradores
  cargo?: string;
  centro_custo?: string;
  data_admissao?: string;
  custo_mensal?: number;
}

export const EmployeesListNew: React.FC = () => {
  const { employees, isLoading, searchEmployees, deleteEmployee } = useCollaborators();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Buscar dados incluindo campos do colaboradores
  useEffect(() => {
    searchEmployees('');
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    searchEmployees(value);
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleDelete = async (employeeId: string, employeeName: string) => {
    try {
      await deleteEmployee(employeeId);
    } catch (error) {
      console.error('Error deleting employee:', error);
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
          <div className="space-y-1">
            <p className="text-muted-foreground">
              {employees.length} colaboradores • {employees.filter(emp => emp.status === 'ativo').length} ativos • {employees.filter(emp => emp.status !== 'ativo').length} inativos
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Botão Adicionar Colaborador */}
          <ColaboradorModal>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Solicitar adição de colaborador
            </Button>
          </ColaboradorModal>
          
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
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
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca'
                : 'Os colaboradores aparecerão aqui quando cadastrados'
              }
            </p>
            {!searchTerm && (
              <ColaboradorModal>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Solicitar Primeiro Colaborador
                </Button>
              </ColaboradorModal>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-all relative">
              <CardContent className="p-6">
                {/* Botão excluir no canto superior direito */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Colaborador</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir <strong>{employee.full_name}</strong>? 
                        Esta ação não pode ser desfeita e removerá permanentemente o colaborador do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(employee.id, employee.full_name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="space-y-3 pr-12">
                  {/* Nome e Status */}
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold text-lg">{employee.full_name}</h4>
                      <Badge className={employee.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações em grid - 4 colunas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    {/* CPF */}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>CPF: {formatCPF(employee.cpf)}</span>
                    </div>

                    {/* Email */}
                    {employee.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{employee.email}</span>
                      </div>
                    )}

                    {/* Empresa */}
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{employee.companies?.legal_name || 'ABALISTSA'}</span>
                    </div>

                    {/* Telefone */}
                    {employee.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{employee.phone}</span>
                      </div>
                    )}

                    {/* Cargo */}
                    {employee.cargo && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{employee.cargo}</span>
                      </div>
                    )}

                    {/* Centro de Custo */}
                    {employee.centro_custo && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{employee.centro_custo}</span>
                      </div>
                    )}

                    {/* Data de Admissão */}
                    {employee.data_admissao && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Admissão: {formatDate(employee.data_admissao)}</span>
                      </div>
                    )}
                  </div>

                  {/* Custo Mensal em destaque */}
                  {employee.custo_mensal && (
                    <div className="text-green-600 font-semibold text-base">
                      Custo: {formatCurrency(employee.custo_mensal)}
                    </div>
                  )}

                  {/* Botão Visualizar */}
                  <div className="pt-3 border-t flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedEmployeeId(employee.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar Detalhes
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

                    {/* Botão Editar Colaborador */}
                    <ColaboradorModal key={`edit-${employee.id}`} employeeToEdit={employee}>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </ColaboradorModal>
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