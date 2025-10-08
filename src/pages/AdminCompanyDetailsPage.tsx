import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Users, Car, FileText, AlertCircle, Calendar } from 'lucide-react';
import { useCompanyDetails } from '@/hooks/useCompanyDetails';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyPolicy {
  id: string;
  numero_apolice: string;
  seguradora: string;
  tipo_beneficio?: string;
  status: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  quantidade_vidas?: number;
  valor_total?: number;
}

interface CompanyVehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  status_seguro: string;
}

interface CompanyUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export default function AdminCompanyDetailsPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const { details, loading } = useCompanyDetails(empresaId || null);
  
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [vehicles, setVehicles] = useState<CompanyVehicle[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!empresaId) return;

    const loadCompanyData = async () => {
      setLoadingData(true);
      
      try {
        // Buscar usuários da empresa
        const { data: memberships } = await supabase
          .from('user_memberships')
          .select('user_id')
          .eq('empresa_id', empresaId);

        const userIds = memberships?.map(m => m.user_id) || [];

        // Buscar perfis dos usuários
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', userIds);

        // Buscar dados de users para pegar email e role
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, role')
          .in('id', userIds);

        // Combinar dados
        const combinedUsers = userProfiles?.map(profile => {
          const userData = usersData?.find(u => u.id === profile.id);
          return {
            id: profile.id,
            display_name: profile.display_name || 'Sem nome',
            email: userData?.email || 'Sem email',
            role: userData?.role || 'cliente',
          };
        }) || [];

        setUsers(combinedUsers);

        // Buscar apólices de benefícios
        const { data: beneficios } = await supabase
          .from('apolices_beneficios')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false });

        // Buscar apólices de PDFs
        const { data: pdfs } = await supabase
          .from('policies')
          .select('*')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        // Combinar e formatar apólices
        const allPolicies: CompanyPolicy[] = [
          ...(beneficios?.map(b => ({
            id: b.id,
            numero_apolice: b.numero_apolice,
            seguradora: b.seguradora,
            tipo_beneficio: b.tipo_beneficio,
            status: b.status || 'ativa',
            inicio_vigencia: b.inicio_vigencia,
            fim_vigencia: b.fim_vigencia,
            quantidade_vidas: b.quantidade_vidas,
            valor_total: b.valor_total,
          })) || []),
          ...(pdfs?.map(p => ({
            id: p.id,
            numero_apolice: p.numero_apolice || 'N/A',
            seguradora: p.seguradora || 'N/A',
            tipo_beneficio: p.tipo_seguro,
            status: p.status || 'pendente_analise',
            inicio_vigencia: p.inicio_vigencia,
            fim_vigencia: p.fim_vigencia,
            quantidade_vidas: undefined,
            valor_total: p.valor_premio,
          })) || []),
        ];

        setPolicies(allPolicies);

        // Buscar veículos
        const { data: veiculos } = await supabase
          .from('frota_veiculos')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(50);

        setVehicles(veiculos?.map(v => ({
          id: v.id,
          placa: v.placa || 'N/A',
          marca: v.marca || 'N/A',
          modelo: v.modelo || 'N/A',
          ano: v.ano_modelo || 0,
          status_seguro: v.status_seguro || 'sem_seguro',
        })) || []);

      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadCompanyData();
  }, [empresaId]);

  if (loading || !details) {
    return (
      <AdminLayout activeSection="overview">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      ativa: 'bg-green-500/10 text-green-700',
      vigente: 'bg-green-500/10 text-green-700',
      vencida: 'bg-red-500/10 text-red-700',
      pendente_analise: 'bg-yellow-500/10 text-yellow-700',
      aguardando_emissao: 'bg-blue-500/10 text-blue-700',
    };
    return statusMap[status] || 'bg-gray-500/10 text-gray-700';
  };

  return (
    <AdminLayout activeSection="overview">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{details.empresa_nome}</h1>
            <p className="text-sm text-muted-foreground">Detalhes completos da empresa</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">Usuários</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{details.usuarios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-sm">Apólices</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{details.apolices}</div>
              <p className="text-xs text-muted-foreground">{details.apolices_ativas} ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">Veículos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{details.veiculos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <CardTitle className="text-sm">Sinistros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{details.sinistros_abertos}</div>
              <p className="text-xs text-muted-foreground">{details.sinistros_total} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-sm">Assistências</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{details.assistencias_abertas}</div>
              <p className="text-xs text-muted-foreground">{details.assistencias_total} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Dados */}
        <Tabs defaultValue="policies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="policies">Apólices ({policies.length})</TabsTrigger>
            <TabsTrigger value="vehicles">Veículos ({vehicles.length})</TabsTrigger>
            <TabsTrigger value="users">Usuários ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Apólices da Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : policies.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma apólice encontrada</p>
                ) : (
                  <div className="space-y-3">
                    {policies.map((policy) => (
                      <div
                        key={policy.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{policy.numero_apolice}</p>
                            <Badge className={getStatusColor(policy.status)}>
                              {policy.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{policy.seguradora}</p>
                          <p className="text-xs text-muted-foreground">
                            {policy.tipo_beneficio || 'Seguro'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(policy.inicio_vigencia).toLocaleDateString('pt-BR')} -{' '}
                            {new Date(policy.fim_vigencia).toLocaleDateString('pt-BR')}
                          </p>
                          {policy.valor_total && (
                            <p className="text-sm text-muted-foreground">
                              R$ {policy.valor_total.toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Veículos da Frota</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : vehicles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum veículo encontrado</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg">{vehicle.placa}</p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.marca} {vehicle.modelo}
                            </p>
                          </div>
                          <Badge variant="outline">{vehicle.ano}</Badge>
                        </div>
                        <Badge className={getStatusColor(vehicle.status_seguro)}>
                          {vehicle.status_seguro.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários da Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
