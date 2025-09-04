import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserX, Search, Trash2, User, Calendar, Building, Phone, Mail } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';

interface ExcluirColaboradorModalProps {
  children: React.ReactNode;
}

export const ExcluirColaboradorModal = ({ children }: ExcluirColaboradorModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const { employees, updateEmployee, isLoading } = useCollaborators();

  const filteredEmployees = employees.filter(emp => 
    emp.status === 'ativo' && 
    (emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.cpf.includes(searchTerm.replace(/\D/g, '')))
  );

  const handleInactivateEmployee = async (employeeId: string) => {
    try {
      await updateEmployee(employeeId, { status: 'inativo' });
      
      toast.success("Colaborador inativado com sucesso!");
      
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Erro ao inativar colaborador:', error);
      toast.error("Erro ao inativar colaborador. Tente novamente.");
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Inativar Colaborador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="search">Nome ou CPF</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome ou CPF do colaborador..."
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Colaboradores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador ativo'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmployees.map((employee) => (
                    <Card key={employee.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{employee.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                CPF: {formatCPF(employee.cpf)}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                              {employee.status}
                            </Badge>
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {employee.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{employee.email}</span>
                              </div>
                            )}
                            
                            {employee.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                            
                            {employee.birth_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>Nasc: {formatDate(employee.birth_date)}</span>
                              </div>
                            )}
                            
                            {employee.companies && (
                              <div className="flex items-center gap-2 md:col-span-3">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                <span>{employee.companies.trade_name || employee.companies.legal_name}</span>
                              </div>
                            )}
                          </div>

                          {/* Dependentes */}
                          {employee.dependents && employee.dependents.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Dependentes ({employee.dependents.length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {employee.dependents.map((dep: any) => (
                                  <Badge key={dep.id} variant="secondary" className="text-xs">
                                    {dep.full_name} ({dep.relationship})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="ml-4"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Inativar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja inativar o colaborador <strong>{employee.full_name}</strong>?
                                <br /><br />
                                Esta ação irá:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Alterar o status para "inativo"</li>
                                  <li>Manter o histórico no sistema</li>
                                  <li>Permitir reativação futura se necessário</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleInactivateEmployee(employee.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Confirmar Inativação
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Fechar */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};