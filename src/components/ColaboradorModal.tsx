import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Trash2, 
  User, 
  UserX, 
  Search,
  Calendar,
  Building,
  Phone,
  Mail,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/hooks/useCollaborators';

interface ColaboradorFormData {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  centro_custo: string;
  data_admissao: string;
  data_nascimento: string;
  custo_mensal: number;
  observacoes?: string;
  documento_pessoal?: File;
  comprovante_residencia?: File;
  comprovacao_vinculo?: File;
}

interface ColaboradorModalProps {
  children: React.ReactNode;
}

export const ColaboradorModal = ({ children }: ColaboradorModalProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('cadastro');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { 
    employees: colaboradores, 
    createEmployee: addColaborador, 
    updateEmployee: updateColaborador, 
    isLoading,
    refetch: loadData 
  } = useCollaborators();

  const form = useForm<ColaboradorFormData>({
    defaultValues: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      cargo: '',
      centro_custo: '',
      data_admissao: '',
      data_nascimento: '',
      custo_mensal: 0,
      observacoes: '',
      documento_pessoal: undefined,
      comprovante_residencia: undefined,
      comprovacao_vinculo: undefined
    }
  });

  const onSubmit = async (data: ColaboradorFormData) => {
    try {
      // Primeiro, buscar a empresa do usuário
      if (!user) {
        toast.error('Usuário não encontrado');
        return;
      }

      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (userError || !userProfile?.company) {
        toast.error('Empresa do usuário não encontrada');
        return;
      }

      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) {
        toast.error('Empresa não encontrada no sistema');
        return;
      }

      // Preparar documentos para upload
      const documents: File[] = [];
      if (data.documento_pessoal) documents.push(data.documento_pessoal);
      if (data.comprovante_residencia) documents.push(data.comprovante_residencia);
      if (data.comprovacao_vinculo) documents.push(data.comprovacao_vinculo);

      await addColaborador({
        fullName: data.nome,
        cpf: data.cpf,
        email: data.email,
        phone: data.telefone,
        birthDate: data.data_nascimento,
        company: {
          cnpj: empresa?.cnpj || '',
          tradeName: empresa?.nome || userProfile.company,
          legalName: empresa?.nome || userProfile.company
        },
        documents: documents.length > 0 ? documents : undefined
      });

      toast.success('Colaborador cadastrado com sucesso!');
      form.reset();
      await loadData();
      setOpen(false);
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error('Erro ao cadastrar colaborador');
    }
  };

  const handleInativar = async (colaboradorId: string) => {
    try {
      await updateColaborador(colaboradorId, {
        status: 'inativo'
      });

      toast.success('Colaborador inativado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao inativar colaborador:', error);
      toast.error('Erro ao inativar colaborador');
    }
  };

  const filteredColaboradores = colaboradores.filter(colaborador =>
    colaborador.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cpf.includes(searchTerm) ||
    (colaborador.email && colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestão de Colaboradores</DialogTitle>
          <DialogDescription>
            Cadastre novos colaboradores ou gerencie os existentes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="cadastro" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Novo Colaborador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cadastrar Novo Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        rules={{ required: 'Nome é obrigatório' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cpf"
                        rules={{ required: 'CPF é obrigatório' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="colaborador@empresa.com" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(11) 99999-9999" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Analista, Gerente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="centro_custo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Centro de Custo</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Financeiro, TI, RH" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_admissao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Admissão</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_nascimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="custo_mensal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo Mensal (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0,00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Seção de Documentos */}
                    <div className="space-y-4">
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4 text-primary">
                          📋 Documentos Obrigatórios (RH)
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="documento_pessoal"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>Documento Pessoal (RG, CPF, CNH) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => onChange(e.target.files?.[0])}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="comprovante_residencia"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>Comprovante de Residência *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => onChange(e.target.files?.[0])}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Conta de luz, água, telefone (máx. 90 dias)
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="comprovacao_vinculo"
                            render={({ field: { onChange, value, ...field } }) => (
                              <FormItem>
                                <FormLabel>Comprovação de Vínculo (e-Social) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => onChange(e.target.files?.[0])}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Documento que comprove vínculo com a empresa
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações adicionais sobre o colaborador"
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};