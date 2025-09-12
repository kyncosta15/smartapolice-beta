import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus,
  UserPlus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  FileText
} from 'lucide-react';
import { ColaboradorModal } from './ColaboradorModal';
import { ExcluirColaboradorModal } from './ExcluirColaboradorModal';
import { IncluirDependenteModal } from './IncluirDependenteModal';
import { EmployeeRequestForm } from './EmployeeRequestForm';
import { useAuth } from '@/contexts/AuthContext';
import { useSmartBeneficiosData } from '@/hooks/useSmartBeneficiosData';
import { formatCurrency } from '@/utils/currencyFormatter';
import { toast } from 'sonner';

export const EmployeesListNew = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isColaboradorModalOpen, setIsColaboradorModalOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [isDependenteModalOpen, setIsDependenteModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<any>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('colaboradores');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  
  const { colaboradores, dependentes, isLoading, error, loadData } = useSmartBeneficiosData();

  // Verificar se o usuário é Admin (pode cadastrar direto) ou RH (precisa solicitar)
  const isAdmin = profile?.role && ['admin', 'administrador', 'corretora_admin'].includes(profile.role);
  const isRH = profile?.role === 'rh';

  const filteredColaboradores = colaboradores.filter(colaborador => {
    const matchesSearch = searchTerm === '' || 
      colaborador.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.cpf?.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || colaborador.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const dependentesAtivos = dependentes.filter(dep => dep.status === 'ativo');

  const stats = {
    colaboradores: colaboradores.filter(col => col.status === 'ativo').length,
    dependentes: dependentesAtivos.length,
    custoTotal: colaboradores
      .filter(col => col.status === 'ativo')
      .reduce((sum, col) => sum + (col.custo_mensal || 0), 0) +
      dependentesAtivos.reduce((sum, dep) => sum + (dep.custo_mensal || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.colaboradores}</p>
                <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.dependentes}</p>
                <p className="text-sm text-muted-foreground">Dependentes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.custoTotal)}</p>
                <p className="text-sm text-muted-foreground">Custo Mensal Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes seções */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colaboradores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="dependentes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dependentes
          </TabsTrigger>
        </TabsList>

        {/* Tab de Colaboradores */}
        <TabsContent value="colaboradores" className="space-y-6">
          {/* Controles e Filtros */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Colaboradores
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {/* Botão condicional baseado no perfil */}
                  {isAdmin ? (
                    // Admin: Cadastro direto
                    <ColaboradorModal>
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Cadastrar Colaborador
                      </Button>
                    </ColaboradorModal>
                  ) : isRH ? (
                    // RH: Solicitação para aprovação
                    <Button
                      onClick={() => setIsRequestFormOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Solicitar Colaborador
                    </Button>
                  ) : null}
                  
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle>Colaboradores ({filteredColaboradores.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Custo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredColaboradores.map((colaborador) => (
                      <TableRow key={colaborador.id}>
                        <TableCell className="font-medium">{colaborador.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{colaborador.cpf}</TableCell>
                        <TableCell>{colaborador.email || '-'}</TableCell>
                        <TableCell>{colaborador.cargo || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              colaborador.status === 'ativo' 
                                ? 'default' 
                                : colaborador.status === 'inativo' 
                                  ? 'secondary' 
                                  : 'outline'
                            }
                          >
                            {colaborador.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {colaborador.custo_mensal ? formatCurrency(colaborador.custo_mensal) : '-'}
                        </TableCell>
                        <TableCell className="space-x-2">
                        <div className="flex flex-wrap gap-1">
                          {/* Sempre pode editar */}
                          <ColaboradorModal employeeToEdit={colaborador}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </ColaboradorModal>
                          
                          {/* Botão de exclusão condicional */}
                          {isAdmin ? (
                            // Admin: Exclusão direta
                            <ExcluirColaboradorModal>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir Colaborador
                              </Button>
                            </ExcluirColaboradorModal>
                          ) : isRH ? (
                            // RH: Solicitação de exclusão (não implementado ainda, mas pode ser adicionado)
                            null
                          ) : null}
                        </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Dependentes */}
        <TabsContent value="dependentes">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Dependentes ({dependentesAtivos.length})
                </CardTitle>
                {/* Botão condicional para dependentes */}
                {isAdmin ? (
                  // Admin: Cadastro direto de dependente
                  <IncluirDependenteModal>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Dependente
                    </Button>
                  </IncluirDependenteModal>
                ) : isRH ? (
                  // RH: Solicitação de dependente (pode ser implementado futuramente)
                  <Button
                    disabled
                    variant="outline"
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Dependente (Em desenvolvimento)
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Parentesco</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependentesAtivos.map((dependente) => (
                      <TableRow key={dependente.id}>
                        <TableCell className="font-medium">{dependente.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{dependente.cpf}</TableCell>
                        <TableCell>{dependente.grau_parentesco}</TableCell>
                        <TableCell>
                          <Badge variant="default">{dependente.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {dependente.custo_mensal ? formatCurrency(dependente.custo_mensal) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Solicitação para RH */}
      {isRH && (
        <EmployeeRequestForm 
          type="add"
          isOpen={isRequestFormOpen}
          onClose={() => setIsRequestFormOpen(false)}
          onSuccess={() => {
            loadData();
            toast.success('Solicitação enviada para aprovação do Admin!');
          }}
        />
      )}
    </div>
  );
};