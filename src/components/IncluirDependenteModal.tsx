import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, User, Calendar, Phone, Mail } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';

interface IncluirDependenteModalProps {
  children: React.ReactNode;
}

export const IncluirDependenteModal = ({ children }: IncluirDependenteModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dependentData, setDependentData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    relationship: '',
  });
  
  const { employees, createDependent, isLoading } = useCollaborators();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      toast.error("Selecione um colaborador");
      return;
    }

    if (!dependentData.full_name || !dependentData.relationship) {
      toast.error("Nome e grau de parentesco são obrigatórios");
      return;
    }

    try {
      await createDependent(selectedEmployeeId, {
        ...dependentData,
      });
      
      toast.success("Dependente incluído com sucesso!");
      
      // Reset form
      setDependentData({
        full_name: '',
        cpf: '',
        birth_date: '',
        relationship: '',
      });
      setSelectedEmployeeId('');
      setOpen(false);
    } catch (error) {
      console.error('Erro ao incluir dependente:', error);
      toast.error("Erro ao incluir dependente. Tente novamente.");
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Incluir Dependente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Colaborador */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Selecionar Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{employee.full_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {employee.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Dados do Dependente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Dependente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={dependentData.full_name}
                    onChange={(e) => setDependentData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nome completo do dependente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Grau de Parentesco *</Label>
                  <Select
                    value={dependentData.relationship}
                    onValueChange={(value) => setDependentData(prev => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conjuge">Cônjuge</SelectItem>
                      <SelectItem value="filho">Filho(a)</SelectItem>
                      <SelectItem value="pai">Pai</SelectItem>
                      <SelectItem value="mae">Mãe</SelectItem>
                      <SelectItem value="irmao">Irmão(ã)</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={dependentData.cpf}
                    onChange={(e) => setDependentData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={dependentData.birth_date}
                    onChange={(e) => setDependentData(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Incluindo...' : 'Incluir Dependente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};