import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Building, 
  CreditCard, 
  Users, 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeDetailsDrawerProps {
  employeeId: string;
  onClose: () => void;
}

export function EmployeeDetailsDrawer({ employeeId, onClose }: EmployeeDetailsDrawerProps) {
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [editingDependent, setEditingDependent] = useState<any>(null);
  const [dependentForm, setDependentForm] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    relationship: '',
    status: 'ativo'
  });

  const { 
    getEmployee, 
    updateEmployee, 
    createDependent, 
    updateDependent, 
    deleteDependent,
    plans 
  } = useCollaborators();

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    setIsLoading(true);
    const data = await getEmployee(employeeId);
    setEmployee(data);
    setIsLoading(false);
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getCurrentPlan = () => {
    return employee?.employee_plans?.find((plan: any) => 
      plan.status === 'ativo' && !plan.end_date
    );
  };

  const getActiveDependents = () => {
    return employee?.dependents?.filter((dep: any) => dep.status === 'ativo') || [];
  };

  const handleDependentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDependent) {
        await updateDependent(editingDependent.id, dependentForm);
      } else {
        await createDependent(employeeId, dependentForm);
      }
      
      resetDependentForm();
      loadEmployee();
    } catch (error) {
      console.error('Error saving dependent:', error);
    }
  };

  const resetDependentForm = () => {
    setDependentForm({
      full_name: '',
      cpf: '',
      birth_date: '',
      relationship: '',
      status: 'ativo'
    });
    setEditingDependent(null);
    setShowDependentForm(false);
  };

  const startEditDependent = (dependent: any) => {
    setDependentForm({
      full_name: dependent.full_name,
      cpf: dependent.cpf || '',
      birth_date: dependent.birth_date || '',
      relationship: dependent.relationship || '',
      status: dependent.status
    });
    setEditingDependent(dependent);
    setShowDependentForm(true);
  };

  const handleDeleteDependent = async (dependentId: string) => {
    if (confirm('Tem certeza que deseja excluir este dependente?')) {
      await deleteDependent(dependentId);
      loadEmployee();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SheetHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </SheetHeader>
        
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Colaborador não encontrado</p>
      </div>
    );
  }

  const currentPlan = getCurrentPlan();
  const activeDependents = getActiveDependents();

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>{employee.full_name}</SheetTitle>
        <SheetDescription>
          Detalhes do colaborador e dependentes
        </SheetDescription>
      </SheetHeader>

      <Accordion type="multiple" defaultValue={["profile", "company", "plan", "dependents"]}>
        {/* Perfil */}
        <AccordionItem value="profile">
          <AccordionTrigger>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <p className="text-sm font-medium">{employee.full_name}</p>
              </div>
              
              <div>
                <Label>CPF</Label>
                <p className="text-sm font-medium">{formatCPF(employee.cpf)}</p>
              </div>
              
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{employee.email || 'Não informado'}</p>
              </div>
              
              <div>
                <Label>Telefone</Label>
                <p className="text-sm font-medium">{employee.phone || 'Não informado'}</p>
              </div>
              
              <div>
                <Label>Data de Nascimento</Label>
                <p className="text-sm font-medium">
                  {employee.birth_date ? formatDate(employee.birth_date) : 'Não informado'}
                </p>
              </div>
              
              <div>
                <Label>Status</Label>
                <Badge variant={employee.status === 'ativo' ? 'default' : 'secondary'}>
                  {employee.status}
                </Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Empresa */}
        <AccordionItem value="company">
          <AccordionTrigger>
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Empresa
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Fantasia</Label>
                <p className="text-sm font-medium">
                  {employee.companies?.trade_name || 'Não informado'}
                </p>
              </div>
              
              <div>
                <Label>Razão Social</Label>
                <p className="text-sm font-medium">{employee.companies?.legal_name}</p>
              </div>
              
              <div className="col-span-2">
                <Label>CNPJ</Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-blue-600"
                  onClick={() => {
                    window.open(`/rh/empresas/${employee.company_id}`, '_blank');
                  }}
                >
                  {formatCNPJ(employee.companies?.cnpj || '')}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Plano Atual */}
        <AccordionItem value="plan">
          <AccordionTrigger>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Plano Atual
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            {currentPlan ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plano</Label>
                  <p className="text-sm font-medium">{currentPlan.plans.name}</p>
                </div>
                
                <div>
                  <Label>Operadora</Label>
                  <p className="text-sm font-medium">{currentPlan.plans.operator}</p>
                </div>
                
                <div>
                  <Label>Data de Início</Label>
                  <p className="text-sm font-medium">{formatDate(currentPlan.start_date)}</p>
                </div>
                
                <div>
                  <Label>Mensalidade</Label>
                  <p className="text-sm font-medium">
                    R$ {Number(currentPlan.monthly_premium).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <Button variant="outline" size="sm">
                    Alterar Plano
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum plano ativo</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Dependentes */}
        <AccordionItem value="dependents">
          <AccordionTrigger>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Dependentes ({activeDependents.length})
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Lista de Dependentes</h4>
              <Dialog open={showDependentForm} onOpenChange={setShowDependentForm}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDependent ? 'Editar Dependente' : 'Novo Dependente'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do dependente
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDependentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dependent_name">Nome Completo *</Label>
                      <Input
                        id="dependent_name"
                        value={dependentForm.full_name}
                        onChange={(e) => setDependentForm(prev => ({ 
                          ...prev, 
                          full_name: e.target.value 
                        }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dependent_cpf">CPF</Label>
                      <Input
                        id="dependent_cpf"
                        value={dependentForm.cpf}
                        onChange={(e) => setDependentForm(prev => ({ 
                          ...prev, 
                          cpf: e.target.value 
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dependent_birth">Data de Nascimento</Label>
                      <Input
                        id="dependent_birth"
                        type="date"
                        value={dependentForm.birth_date}
                        onChange={(e) => setDependentForm(prev => ({ 
                          ...prev, 
                          birth_date: e.target.value 
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dependent_relationship">Grau de Parentesco</Label>
                      <Select 
                        value={dependentForm.relationship} 
                        onValueChange={(value) => setDependentForm(prev => ({ 
                          ...prev, 
                          relationship: value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o parentesco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conjuge">Cônjuge</SelectItem>
                          <SelectItem value="filho">Filho(a)</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={resetDependentForm}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingDependent ? 'Salvar' : 'Adicionar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {activeDependents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dependente cadastrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Parentesco</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDependents.map((dependent: any) => (
                    <TableRow key={dependent.id}>
                      <TableCell className="font-medium">
                        {dependent.full_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {dependent.relationship || 'Não informado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dependent.birth_date ? formatDate(dependent.birth_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditDependent(dependent)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDependent(dependent.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}