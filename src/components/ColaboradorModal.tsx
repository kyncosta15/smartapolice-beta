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
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';

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
    colaboradores, 
    addColaborador, 
    updateColaborador, 
    isLoading,
    loadData 
  } = useSmartBeneficiosData();

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
      observacoes: ''
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
        .select('id')
        .eq('nome', userProfile.company)
        .single();

      if (empresaError || !empresa) {
        toast.error('Empresa não encontrada no sistema');
        return;
      }

      await addColaborador({
        empresa_id: empresa.id,
        nome: data.nome,
        cpf: data.cpf,
        email: data.email,
        telefone: data.telefone,
        cargo: data.cargo,
        centro_custo: data.centro_custo,
        data_admissao: data.data_admissao,
        data_nascimento: data.data_nascimento,
        custo_mensal: Number(data.custo_mensal),
        observacoes: data.observacoes,
        status: 'ativo'
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
        status: 'inativo',
        data_demissao: new Date().toISOString().split('T')[0]
      });

      toast.success('Colaborador inativado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao inativar colaborador:', error);
      toast.error('Erro ao inativar colaborador');
    }
  };

  const filteredColaboradores = colaboradores.filter(colaborador =>
    colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cpf.includes(searchTerm) ||
    colaborador.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cadastro" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar
            </TabsTrigger>
            <TabsTrigger value="gerenciar" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Gerenciar
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

          <TabsContent value="gerenciar" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Colaboradores Cadastrados
                </CardTitle>
                <div className="flex items-center gap-2 mt-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar colaborador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Badge variant="outline">
                    {filteredColaboradores.length} colaboradores
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Carregando colaboradores...</p>
                  </div>
                ) : filteredColaboradores.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm 
                        ? 'Tente alterar os termos de busca' 
                        : 'Use a aba "Cadastrar" para adicionar colaboradores'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredColaboradores.map((colaborador) => (
                      <div 
                        key={colaborador.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{colaborador.nome}</h4>
                              <Badge 
                                className={
                                  colaborador.status === 'ativo' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {colaborador.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                CPF: {colaborador.cpf}
                              </div>
                              {colaborador.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {colaborador.email}
                                </div>
                              )}
                              {colaborador.cargo && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {colaborador.cargo}
                                </div>
                              )}
                              {colaborador.telefone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {colaborador.telefone}
                                </div>
                              )}
                              {colaborador.centro_custo && (
                                <div className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {colaborador.centro_custo}
                                </div>
                              )}
                              {colaborador.data_admissao && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Admissão: {new Date(colaborador.data_admissao).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                            
                            {colaborador.custo_mensal && (
                              <div className="text-sm font-medium text-green-600">
                                Custo: R$ {colaborador.custo_mensal.toFixed(2).replace('.', ',')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {colaborador.status === 'ativo' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Inativar Colaborador</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja inativar <strong>{colaborador.nome}</strong>? 
                                      Esta ação marcará o colaborador como inativo no sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleInativar(colaborador.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Inativar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};