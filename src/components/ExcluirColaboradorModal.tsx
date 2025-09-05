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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UserX, Search, Trash2, User, Calendar, Building, Phone, Mail, Users, Loader2 } from 'lucide-react';
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
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [currentDeletionStep, setCurrentDeletionStep] = useState('');
  const [deletedCount, setDeletedCount] = useState(0);
  const [totalToDelete, setTotalToDelete] = useState(0);
  
  const { employees, updateEmployee, isLoading, refetch } = useCollaborators();

  const filteredEmployees = employees.filter(emp => 
    emp.status === 'ativo' && 
    (emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.cpf.includes(searchTerm.replace(/\D/g, '')))
  );

  const deleteSelectedEmployees = async () => {
    if (selectedEmployees.size === 0) return;
    
    setIsDeleting(true);
    setDeletionProgress(0);
    setDeletedCount(0);
    
    const employeeIds = Array.from(selectedEmployees);
    setTotalToDelete(employeeIds.length);
    
    try {
      let completed = 0;

      // Usar edge function para exclusão segura com CASCADE
      setCurrentDeletionStep('Excluindo colaboradores...');
      for (const [index, employeeId] of employeeIds.entries()) {
        try {
          const { data, error } = await supabase.functions.invoke('colaboradores-delete', {
            body: { id: employeeId }
          });

          if (error) throw error;
          if (!data?.ok) throw new Error(data?.error?.message || 'Erro ao excluir colaborador');

          completed++;
          setDeletedCount(completed);
          const progress = Math.round((completed / employeeIds.length) * 100);
          setDeletionProgress(progress);
          setCurrentDeletionStep(`Excluído ${completed} de ${employeeIds.length} colaboradores...`);
          
          // Pequena pausa para mostrar o progresso
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Erro ao excluir colaborador ${employeeId}:`, error);
          toast.error(`Erro ao excluir colaborador ${index + 1}/${employeeIds.length}: ${error.message || error}`);
        }
      }

      if (completed > 0) {
        toast.success(`${completed} colaborador(es) foram excluídos com sucesso!`);
      }

      if (completed < employeeIds.length) {
        toast.error(`Apenas ${completed} de ${employeeIds.length} colaboradores foram excluídos. Verifique o console para mais detalhes.`);
      }

      // Sempre limpar seleção e recarregar dados
      setSelectedEmployees(new Set());
      await refetch();
      
    } catch (error) {
      console.error('Erro durante a exclusão em massa:', error);
      toast.error(`Erro durante o processo de exclusão: ${error.message || error}`);
    } finally {
      setIsDeleting(false);
      setDeletionProgress(0);
      setCurrentDeletionStep('');
      setDeletedCount(0);
      setTotalToDelete(0);
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
                     <AlertDialogContent className="max-w-md">
                       <AlertDialogHeader>
                         <AlertDialogTitle className="text-destructive flex items-center gap-2">
                           <Trash2 className="h-5 w-5" />
                           Confirmar Exclusão Permanente
                         </AlertDialogTitle>
                         <AlertDialogDescription className="space-y-3">
                           <p>
                             Tem certeza que deseja excluir permanentemente <strong>{selectedEmployees.size} colaborador(es)</strong>?
                           </p>
                           
                           <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                             <p className="font-semibold text-red-800 mb-2">⚠️ Esta ação é IRREVERSÍVEL e irá:</p>
                             <ul className="text-sm text-red-700 space-y-1">
                               <li>• Remover os colaboradores completamente do sistema</li>
                               <li>• Excluir todos os dependentes associados</li>
                               <li>• Apagar todo o histórico permanentemente</li>
                               <li>• Não pode ser desfeita após confirmação</li>
                             </ul>
                           </div>
                           
                           {selectedEmployees.size <= 5 && (
                             <div className="bg-gray-50 border p-2 rounded text-xs">
                               <p className="font-medium mb-1">Colaboradores selecionados:</p>
                               {filteredEmployees
                                 .filter(emp => selectedEmployees.has(emp.id))
                                 .map(emp => (
                                   <div key={emp.id} className="text-muted-foreground">
                                     • {emp.full_name} (CPF: {formatCPF(emp.cpf)})
                                   </div>
                                 ))
                               }
                             </div>
                           )}
                           
                           <p className="text-sm text-muted-foreground">
                             O processo será executado de forma assíncrona com progresso em tempo real.
                           </p>
                         </AlertDialogDescription>
                       </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction
                          onClick={deleteSelectedEmployees}
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Excluindo...
                            </div>
                          ) : (
                            'Confirmar Exclusão'
                          )}
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

              {/* Progress Section - aparece apenas quando está excluindo */}
              {isDeleting && (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-destructive">Exclusão em Progresso</span>
                      <span className="text-muted-foreground">{deletionProgress}%</span>
                    </div>
                    
                    <Progress value={deletionProgress} className="w-full h-2" />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{currentDeletionStep}</span>
                      <span className="font-medium">{deletedCount}/{totalToDelete} concluído</span>
                    </div>

                    {currentDeletionStep.includes('Excluindo colaboradores') && (
                      <div className="text-xs text-orange-600 mt-2">
                        ⚠️ Processo irreversível em andamento...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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