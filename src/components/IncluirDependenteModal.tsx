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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, User, Calendar, Phone, Mail, Users, Building2 } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';

interface IncluirDependenteModalProps {
  children: React.ReactNode;
}

export const IncluirDependenteModal = ({ children }: IncluirDependenteModalProps) => {
  const [open, setOpen] = useState(false);
  const [incluirDependente, setIncluirDependente] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    fullName: '',
    cpf: '',
    birthDate: '',
    email: '',
    phone: '',
  });
  const [companyData, setCompanyData] = useState({
    cnpj: '',
    tradeName: '',
    legalName: '',
  });
  const [planData, setPlanData] = useState({
    planId: '',
    monthlyPremium: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [dependentData, setDependentData] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    relationship: '',
  });
  
  const { createEmployee, createDependent, isLoading, plans } = useCollaborators();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeData.fullName || !employeeData.cpf || !companyData.cnpj || !companyData.legalName) {
      toast.error("Nome, CPF, CNPJ e Razão Social da empresa são obrigatórios");
      return;
    }

    if (incluirDependente && (!dependentData.full_name || !dependentData.relationship)) {
      toast.error("Nome e grau de parentesco do dependente são obrigatórios");
      return;
    }

    try {
      // Criar colaborador
      const employeeCreateData = {
        ...employeeData,
        company: companyData,
        initialPlan: planData.planId ? {
          planId: planData.planId,
          monthlyPremium: parseFloat(planData.monthlyPremium),
          startDate: planData.startDate
        } : undefined
      };
      
      const newEmployee = await createEmployee(employeeCreateData);
      
      // Se marcou para incluir dependente, criar o dependente
      if (incluirDependente && newEmployee?.id) {
        await createDependent(newEmployee.id, dependentData);
        toast.success("Colaborador e dependente incluídos com sucesso!");
      } else {
        toast.success("Colaborador incluído com sucesso!");
      }
      
      // Reset form
      setEmployeeData({
        fullName: '',
        cpf: '',
        birthDate: '',
        email: '',
        phone: '',
      });
      setCompanyData({
        cnpj: '',
        tradeName: '',
        legalName: '',
      });
      setPlanData({
        planId: '',
        monthlyPremium: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      setDependentData({
        full_name: '',
        cpf: '',
        birth_date: '',
        relationship: '',
      });
      setIncluirDependente(false);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao incluir colaborador:', error);
      toast.error("Erro ao incluir colaborador. Tente novamente.");
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .slice(0, 11)
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .slice(0, 14)
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handlePlanChange = (planId: string) => {
    setPlanData(prev => ({ ...prev, planId }));
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan?.base_monthly_cost) {
      setPlanData(prev => ({ 
        ...prev, 
        monthlyPremium: selectedPlan.base_monthly_cost!.toString() 
      }));
    }
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
            Incluir Colaborador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_cnpj">CNPJ *</Label>
                  <Input
                    id="company_cnpj"
                    value={companyData.cnpj}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_legal_name">Razão Social *</Label>
                  <Input
                    id="company_legal_name"
                    value={companyData.legalName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, legalName: e.target.value }))}
                    placeholder="Nome da empresa na Receita Federal"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company_trade_name">Nome Fantasia</Label>
                  <Input
                    id="company_trade_name"
                    value={companyData.tradeName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, tradeName: e.target.value }))}
                    placeholder="Nome comercial da empresa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Colaborador */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_name">Nome Completo *</Label>
                  <Input
                    id="employee_name"
                    value={employeeData.fullName}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nome completo do colaborador"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_cpf">CPF *</Label>
                  <Input
                    id="employee_cpf"
                    value={employeeData.cpf}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_email">E-mail</Label>
                  <Input
                    id="employee_email"
                    type="email"
                    value={employeeData.email}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_phone">Telefone</Label>
                  <Input
                    id="employee_phone"
                    value={employeeData.phone}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_birth_date">Data de Nascimento</Label>
                  <Input
                    id="employee_birth_date"
                    type="date"
                    value={employeeData.birthDate}
                    onChange={(e) => setEmployeeData(prev => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plano Inicial (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Plano Inicial (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_id">Plano</Label>
                  <Select value={planData.planId} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.operator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_premium">Valor Mensal (R$)</Label>
                  <Input
                    id="monthly_premium"
                    type="number"
                    step="0.01"
                    min="0"
                    value={planData.monthlyPremium}
                    onChange={(e) => setPlanData(prev => ({ ...prev, monthlyPremium: e.target.value }))}
                    disabled={!planData.planId}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={planData.startDate}
                    onChange={(e) => setPlanData(prev => ({ ...prev, startDate: e.target.value }))}
                    disabled={!planData.planId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opção de Dependente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Incluir Dependente?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_dependente"
                  checked={incluirDependente}
                  onCheckedChange={(checked) => setIncluirDependente(checked as boolean)}
                />
                <Label htmlFor="incluir_dependente">
                  Sim, desejo incluir um dependente junto com este colaborador
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Dependente - Só aparece se marcado */}
          {incluirDependente && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Dependente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dependent_name">Nome Completo *</Label>
                    <Input
                      id="dependent_name"
                      value={dependentData.full_name}
                      onChange={(e) => setDependentData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Nome completo do dependente"
                      required={incluirDependente}
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
                    <Label htmlFor="dependent_cpf">CPF</Label>
                    <Input
                      id="dependent_cpf"
                      value={dependentData.cpf}
                      onChange={(e) => setDependentData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dependent_birth_date">Data de Nascimento</Label>
                    <Input
                      id="dependent_birth_date"
                      type="date"
                      value={dependentData.birth_date}
                      onChange={(e) => setDependentData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              {isLoading ? 'Incluindo...' : incluirDependente ? 'Incluir Colaborador e Dependente' : 'Incluir Colaborador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};