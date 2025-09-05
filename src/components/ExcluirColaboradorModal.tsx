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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { UserX, Search, Trash2, User, Calendar, Building, Phone, Mail, Users } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { supabase } from '@/integrations/supabase/client';

interface ExcluirColaboradorModalProps {
  children: React.ReactNode;
}

export const ExcluirColaboradorModal = ({ children }: ExcluirColaboradorModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { employees, updateEmployee, isLoading, refetch } = useCollaborators();

  const filteredEmployees = employees.filter(emp => 
    emp.status === 'ativo' && 
    (emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.cpf.includes(searchTerm.replace(/\D/g, '')))
  );

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
      await refetch();
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
            Excluir Colaboradores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Busca e Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Buscar e Gerenciar Colaboradores
                </div>
                {selectedEmployees.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir ({selectedEmployees.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir permanentemente {selectedEmployees.size} colaborador(es)?
                          <br /><br />
                          <strong>Esta ação não pode ser desfeita e irá:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-red-600">
                            <li>Remover os colaboradores completamente do sistema</li>
                            <li>Excluir todos os dependentes associados</li>
                            <li>Apagar todo o histórico permanentemente</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteSelectedEmployees}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Controle de seleção */}
              {filteredEmployees.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onCheckedChange={toggleSelectAll}
                    id="select-all-modal"
                  />
                  <label htmlFor="select-all-modal" className="text-sm font-medium cursor-pointer">
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
                    <Card key={employee.id} className={`p-4 ${selectedEmployees.has(employee.id) ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox de seleção */}
                        <Checkbox
                          checked={selectedEmployees.has(employee.id)}
                          onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <h3 className="font-medium">{employee.full_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  CPF: {formatCPF(employee.cpf)}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
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
                              <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <Users className="h-3 w-3" />
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