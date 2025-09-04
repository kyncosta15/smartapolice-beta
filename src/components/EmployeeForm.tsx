import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const employeeSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  company: z.object({
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
    legalName: z.string().min(2, 'Razão social obrigatória'),
    tradeName: z.string().optional()
  }),
  initialPlan: z.object({
    planId: z.string(),
    monthlyPremium: z.number().positive('Valor deve ser positivo'),
    startDate: z.string()
  }).optional()
});

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
  base_monthly_cost?: number;
}

interface EmployeeFormProps {
  plans: Plan[];
  companies: Company[];
  onSubmit: (data: z.infer<typeof employeeSchema>) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeForm({ plans, companies, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    cnpj: '',
    legalName: '',
    tradeName: '',
    planId: '',
    monthlyPremium: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData(prev => ({ ...prev, cnpj: formatted }));
    
    // Auto-fill company data if CNPJ exists
    const cnpjNumbers = formatted.replace(/\D/g, '');
    const existingCompany = companies.find(c => c.cnpj.replace(/\D/g, '') === cnpjNumbers);
    if (existingCompany) {
      setFormData(prev => ({
        ...prev,
        legalName: existingCompany.legal_name,
        tradeName: existingCompany.trade_name || ''
      }));
    }
  };

  const handlePlanChange = (planId: string) => {
    setFormData(prev => ({ ...prev, planId }));
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan?.base_monthly_cost) {
      setFormData(prev => ({ 
        ...prev, 
        monthlyPremium: selectedPlan.base_monthly_cost!.toString() 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanedData = {
        fullName: formData.fullName,
        cpf: formData.cpf.replace(/\D/g, ''),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        company: {
          cnpj: formData.cnpj.replace(/\D/g, ''),
          legalName: formData.legalName,
          tradeName: formData.tradeName || undefined
        },
        initialPlan: formData.planId ? {
          planId: formData.planId,
          monthlyPremium: parseFloat(formData.monthlyPremium),
          startDate: formData.startDate
        } : undefined
      };

      const validated = employeeSchema.parse(cleanedData);
      await onSubmit(validated as any);
      
      // Reset form
      setFormData({
        fullName: '',
        cpf: '',
        email: '',
        phone: '',
        birthDate: '',
        cnpj: '',
        legalName: '',
        tradeName: '',
        planId: '',
        monthlyPremium: '',
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Dados inválidos',
          description: error.errors[0].message,
          variant: 'destructive'
        });
      } else {
        console.error('Error submitting form:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Pessoais */}
      <div>
        <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Dados da Empresa */}
      <div>
        <h3 className="text-lg font-medium mb-4">Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tradeName">Nome Fantasia</Label>
            <Input
              id="tradeName"
              value={formData.tradeName}
              onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="legalName">Razão Social *</Label>
            <Input
              id="legalName"
              value={formData.legalName}
              onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Plano Inicial (Opcional) */}
      <div>
        <h3 className="text-lg font-medium mb-4">Plano Inicial (Opcional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="planId">Plano</Label>
            <Select value={formData.planId} onValueChange={handlePlanChange}>
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
            <Label htmlFor="monthlyPremium">Valor Mensal (R$)</Label>
            <Input
              id="monthlyPremium"
              type="number"
              step="0.01"
              min="0"
              value={formData.monthlyPremium}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyPremium: e.target.value }))}
              disabled={!formData.planId}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              disabled={!formData.planId}
            />
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Colaborador'}
        </Button>
      </div>
    </form>
  );
}