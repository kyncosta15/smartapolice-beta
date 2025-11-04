import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CompanySidePanel } from '@/components/admin/CompanySidePanel';
import { AdminCharts } from '@/components/admin/AdminCharts';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, Car, Building, Search, Mail, LifeBuoy, Trash2, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CompanySummary } from '@/types/admin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Period = '30' | '60';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { metrics, companies, loading, deleting, deleteCompanies } = useAdminMetrics();
  const [period, setPeriod] = useState<Period>('30');
  const [selectedCompany, setSelectedCompany] = useState<CompanySummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // Filtrar empresas e veículos por termo de busca - antes dos early returns
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(c => 
      c.empresa_nome.toLowerCase().includes(term) ||
      c.empresa_id.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  // Filtrar veículos por empresas filtradas - antes dos early returns
  const filteredVehicles = useMemo(() => {
    if (!metrics) return [];
    if (!searchTerm.trim()) return metrics.veiculos_por_empresa;
    
    const filteredIds = filteredCompanies.map(c => c.empresa_id);
    return metrics.veiculos_por_empresa.filter(v => filteredIds.includes(v.empresa_id));
  }, [metrics, searchTerm, filteredCompanies]);

  if (loading) {
    return (
      <AdminLayout activeSection="overview">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) return null;

  const averages = period === '30' ? metrics.medias_30 : metrics.medias_60;

  const toggleCompanySelection = (companyId: string) => {
    const newSelection = new Set(selectedCompanies);
    if (newSelection.has(companyId)) {
      newSelection.delete(companyId);
    } else {
      newSelection.add(companyId);
    }
    setSelectedCompanies(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.size === filteredCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(filteredCompanies.map(c => c.empresa_id)));
    }
  };

  const handleDeleteSelected = async () => {
    const success = await deleteCompanies(Array.from(selectedCompanies));
    if (success) {
      setSelectedCompanies(new Set());
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!companyToDelete) return;
    const success = await deleteCompanies([companyToDelete]);
    if (success) {
      setCompanyToDelete(null);
    }
  };

  return (
    <AdminLayout activeSection="overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Painel Administrativo</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Visão geral de todas as contas do sistema</p>
            </div>
            <Button 
              onClick={() => navigate('/admin/inserir-veiculos')}
              className="gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Inserir Veículos em Lote
            </Button>
          </div>

          {/* Filtro de Busca */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome da empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total de Contas</CardTitle>
              <Building className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{filteredCompanies.length}</div>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'Filtradas' : 'No sistema'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total de Apólices</CardTitle>
              <Shield className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-xl md:text-2xl font-bold">{metrics?.apolices_total || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Sincronizadas no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total de Veículos</CardTitle>
              <Car className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">
                {filteredVehicles.reduce((sum, v) => sum + v.total_veiculos, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Em todas as contas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Sinistros</CardTitle>
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{metrics.sinistros_total}</div>
              <p className="text-xs text-muted-foreground">
                Total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Assistências</CardTitle>
              <LifeBuoy className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{metrics.assistencias_total}</div>
              <p className="text-xs text-muted-foreground">
                Total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <AdminCharts metrics={metrics} />

        {/* Tabela de Todas as Contas */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base md:text-xl">
                Todas as Contas
                {searchTerm && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    - {filteredCompanies.length} resultados
                  </span>
                )}
              </CardTitle>
              
              {selectedCompanies.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar {selectedCompanies.size} selecionada(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 md:p-6 max-h-[600px] overflow-y-auto">
            {/* Mobile: Cards */}
            <div className="block md:hidden space-y-4 p-4">
              {filteredCompanies.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building className="h-12 w-12 text-muted-foreground/50" />
                    <p className="font-medium">Nenhuma empresa encontrada</p>
                  </div>
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <Card 
                    key={company.empresa_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{company.empresa_nome}</h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            {company.empresa_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Usuários</div>
                        <div className="text-lg font-semibold text-blue-600">{company.usuarios}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Apólices</div>
                        <div className="text-lg font-semibold text-purple-600">{company.apolices}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Veículos</div>
                        <div className="text-lg font-semibold text-green-600">{company.veiculos}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Sinistros</div>
                        <div className={`text-lg font-semibold ${company.sinistros_abertos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {company.sinistros_abertos}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Assistências</div>
                        <div className={`text-lg font-semibold ${company.assistencias_abertas > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {company.assistencias_abertas}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Atividade</div>
                        <div className="text-xs font-medium">
                          {company.ultima_atividade && new Date(company.ultima_atividade).getFullYear() > 2000
                            ? new Date(company.ultima_atividade).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short'
                              })
                            : 'Sem'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block rounded-lg border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-4 w-12">
                        <Checkbox
                          checked={selectedCompanies.size === filteredCompanies.length && filteredCompanies.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-foreground">Empresa</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Usuários</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Apólices</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Veículos</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Sinistros</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Assistências</th>
                      <th className="p-4 text-center text-sm font-semibold text-foreground">Última Atividade</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Building className="h-12 w-12 text-muted-foreground/50" />
                            <p className="font-medium">Nenhuma empresa encontrada</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company) => (
                        <tr 
                          key={company.empresa_id}
                          className="border-b hover:bg-accent/50 transition-colors group"
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedCompanies.has(company.empresa_id)}
                              onCheckedChange={() => toggleCompanySelection(company.empresa_id)}
                            />
                          </td>
                          <td className="p-4 cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {company.conta_nome || company.empresa_nome}
                                </div>
                                {company.conta_email && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{company.conta_email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-sm">
                              {company.usuarios}
                            </span>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold text-sm">
                              {company.apolices}
                            </span>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-sm">
                              {company.veiculos}
                            </span>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full font-semibold text-sm ${
                              company.sinistros_abertos > 0 
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400' 
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            }`}>
                              {company.sinistros_abertos}
                            </span>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className={`inline-flex items-center justify-center h-8 px-3 rounded-full font-semibold text-sm ${
                              company.assistencias_abertas > 0 
                                ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400' 
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            }`}>
                              {company.assistencias_abertas}
                            </span>
                          </td>
                          <td className="p-4 text-center cursor-pointer" onClick={() => setSelectedCompany(company)}>
                            <span className="text-sm text-muted-foreground">
                              {company.ultima_atividade && new Date(company.ultima_atividade).getFullYear() > 2000
                                ? new Date(company.ultima_atividade).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })
                              : 'Sem atividade'}
                            </span>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setCompanyToDelete(company.empresa_id)}
                              disabled={deleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredCompanies.length > 0 && (
                <p className="text-sm text-muted-foreground p-4 border-t">
                  Clique em uma linha para ver detalhes da empresa
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <CompanySidePanel
        open={!!selectedCompany}
        onOpenChange={(open) => !open && setSelectedCompany(null)}
        company={selectedCompany}
      />

      {/* Delete Multiple Companies Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar <strong>{selectedCompanies.size}</strong> empresa(s) e todos os seus dados associados:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Veículos e documentos da frota</li>
                <li>Colaboradores e dependentes</li>
                <li>Apólices de benefícios</li>
                <li>Tickets e sinistros</li>
                <li>Solicitações de aprovação</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">Esta ação não pode ser desfeita!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deletando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Company Dialog */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar esta empresa e todos os seus dados associados:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Veículos e documentos da frota</li>
                <li>Colaboradores e dependentes</li>
                <li>Apólices de benefícios</li>
                <li>Tickets e sinistros</li>
                <li>Solicitações de aprovação</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">Esta ação não pode ser desfeita!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deletando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
