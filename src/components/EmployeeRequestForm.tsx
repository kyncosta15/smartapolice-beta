import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserPlus, UserMinus, Calendar, User, Mail, Phone, Building, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeeRequestFormProps {
  type: 'add' | 'remove';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedEmployee?: {
    id: string;
    nome: string;
    cpf: string;
    email?: string;
  } | null;
}

export const EmployeeRequestForm: React.FC<EmployeeRequestFormProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
  selectedEmployee
}) => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: selectedEmployee?.nome || '',
    cpf: selectedEmployee?.cpf || '',
    email: selectedEmployee?.email || '',
    telefone: '',
    dataNascimento: '',
    cargo: '',
    centroCusto: '',
    dataAdmissao: '',
    dataDesligamento: '',
    plano: '',
    tipo: 'titular',
    motivo: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.role) return;

    setIsLoading(true);
    try {
      console.log('📝 Criando solicitação de colaborador:', type);

      // Validações básicas
      if (type === 'add') {
        if (!formData.nome || !formData.cpf || !formData.dataAdmissao) {
          toast.error('Preencha os campos obrigatórios: Nome, CPF e Data de Admissão');
          return;
        }
      } else {
        if (!formData.dataDesligamento || !formData.motivo) {
          toast.error('Preencha os campos obrigatórios: Data de Desligamento e Motivo');
          return;
        }
      }

      // Preparar dados da solicitação
      const requestData = {
        kind: type === 'add' ? 'inclusao' : 'exclusao' as 'inclusao' | 'exclusao',
        employee_data: type === 'add' ? {
          nome: formData.nome,
          cpf: formData.cpf.replace(/\D/g, ''),
          email: formData.email || null,
          telefone: formData.telefone || null,
          data_nascimento: formData.dataNascimento || null,
          cargo: formData.cargo || null,
          centro_custo: formData.centroCusto || null,
          data_admissao: formData.dataAdmissao,
          plano: formData.plano || null,
          tipo: formData.tipo
        } : {
          employee_id: selectedEmployee?.id,
          data_desligamento: formData.dataDesligamento,
          motivo: formData.motivo
        },
        observacoes: formData.observacoes || null
      };

      console.log('📤 Enviando solicitação:', requestData);

      // Criar solicitação via edge function
      const { data, error } = await supabase.functions.invoke('rh-employee-request', {
        body: requestData
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao criar solicitação');
      }

      if (!data?.ok) {
        console.error('❌ Resposta inválida:', data);
        throw new Error(data?.error?.message || 'Erro ao criar solicitação');
      }

      console.log('✅ Solicitação criada:', data.data);
      
      const protocol = data.data?.protocol_code || 'N/A';
      
      if (type === 'add') {
        toast.success(`Solicitação de inclusão criada! Protocolo: ${protocol}`);
      } else {
        toast.success(`Solicitação de exclusão criada! Protocolo: ${protocol}`);
      }

      // Reset form
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        dataNascimento: '',
        cargo: '',
        centroCusto: '',
        dataAdmissao: '',
        dataDesligamento: '',
        plano: '',
        tipo: 'titular',
        motivo: '',
        observacoes: ''
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('💥 Erro ao criar solicitação:', error);
      toast.error(error.message || 'Falha ao criar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'add' ? (
              <>
                <UserPlus className="h-5 w-5 text-green-600" />
                Solicitar Inclusão de Colaborador
              </>
            ) : (
              <>
                <UserMinus className="h-5 w-5 text-red-600" />
                Solicitar Exclusão de Colaborador
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'add' ? (
            // Formulário de Inclusão
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Nome completo do colaborador"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataAdmissao"
                      type="date"
                      value={formData.dataAdmissao}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cargo"
                      placeholder="Cargo do colaborador"
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centroCusto">Centro de Custo</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="centroCusto"
                      placeholder="Centro de custo"
                      value={formData.centroCusto}
                      onChange={(e) => setFormData(prev => ({ ...prev, centroCusto: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plano">Plano de Saúde</Label>
                  <Select value={formData.plano} onValueChange={(value) => setFormData(prev => ({ ...prev, plano: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Plano Básico</SelectItem>
                      <SelectItem value="intermediario">Plano Intermediário</SelectItem>
                      <SelectItem value="premium">Plano Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Tipo de Beneficiário</Label>
                  <RadioGroup
                    value={formData.tipo}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="titular" id="titular" />
                      <Label htmlFor="titular">Titular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dependente" id="dependente" />
                      <Label htmlFor="dependente">Dependente</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </>
          ) : (
            // Formulário de Exclusão
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Colaborador Selecionado:</h3>
                <p className="text-sm text-red-700">
                  <strong>Nome:</strong> {selectedEmployee?.nome} <br />
                  <strong>CPF:</strong> {selectedEmployee?.cpf}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataDesligamento">Data de Desligamento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dataDesligamento"
                      type="date"
                      value={formData.dataDesligamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataDesligamento: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo do Desligamento *</Label>
                  <Select 
                    value={formData.motivo} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demissao">Demissão</SelectItem>
                      <SelectItem value="pedido">Pedido de Demissão</SelectItem>
                      <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais sobre a solicitação..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                type === 'add' ? 'Solicitar Inclusão' : 'Solicitar Exclusão'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};