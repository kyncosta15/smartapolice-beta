import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProgressToaster } from "@/components/ui/progress-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SessionTimeoutGuard from '@/components/SessionTimeoutGuard';

const LandingPage = lazy(() => import('@/components/LandingPage').then((module) => ({ default: module.LandingPage })));
const SystemSelection = lazy(() => import('@/components/SystemSelection'));
const SmartApoliceAuth = lazy(() => import('@/components/SmartApoliceAuth'));
const SmartBeneficiosAuthFunctional = lazy(() => import('@/components/SmartBeneficiosAuthFunctional'));
const SmartBeneficiosGuard = lazy(() => import('@/components/SmartBeneficiosGuard'));
const ColaboradorSolicitacao = lazy(() => import('@/components/ColaboradorSolicitacao'));
const AuthGuard = lazy(() => import('@/components/AuthGuard'));
const ColaboradorFormPage = lazy(() => import('./pages/ColaboradorFormPage'));
const NewSolicitacaoPage = lazy(() => import('./pages/NewSolicitacaoPage'));
const PublicFleetRequestPage = lazy(() => import('./pages/PublicFleetRequestPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const RHDashboard = lazy(() => import('./pages/RHDashboard'));
const RHColaboradores = lazy(() => import('./pages/RHColaboradores'));
const AdminApprovalsPage = lazy(() => import('./pages/AdminApprovalsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminRequestsPage = lazy(() => import('./pages/AdminRequestsPage'));
const AdminCompanyDetailsPage = lazy(() => import('./pages/AdminCompanyDetailsPage'));
const AdminProfilePage = lazy(() => import('./pages/AdminProfilePage'));
const AdminEmailSettingsPage = lazy(() => import('./pages/AdminEmailSettingsPage'));
const AdminWebhooksPage = lazy(() => import('./pages/AdminWebhooksPage'));
const CentralDeDadosPage = lazy(() => import('./pages/CentralDeDadosPage'));
const InserirVeiculosLotePage = lazy(() => import('./pages/InserirVeiculosLotePage'));
const AdminAccessLogsPage = lazy(() => import('./pages/AdminAccessLogsPage'));
const AdminPresencePage = lazy(() => import('./pages/admin/AdminPresencePage'));
const AdminCentralPage = lazy(() => import('./pages/admin/AdminCentralPage'));
const SmartApoliceWorkflowPage = lazy(() => import('./pages/admin/SmartApoliceWorkflowPage'));
const SystemStatusPage = lazy(() => import('./pages/SystemStatusPage'));
const ConsultoriaListPage = lazy(() => import('./pages/consultoria/ConsultoriaListPage'));
const ConsultoriaNovoCasoPage = lazy(() => import('./pages/consultoria/ConsultoriaNovoCasoPage'));
const ConsultoriaCasoDetailPage = lazy(() => import('./pages/consultoria/ConsultoriaCasoDetailPage'));
const ConsultoriaConfigPage = lazy(() => import('./pages/consultoria/ConsultoriaConfigPage'));
const ConsultoriaParecerPage = lazy(() => import('./pages/consultoria/ConsultoriaParecerPage'));
const ConsultoriaClientesPremiumPage = lazy(() => import('./pages/consultoria/ConsultoriaClientesPremiumPage'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => {
  const isStatusPage =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/status');

  if (isStatusPage) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-200">
        <header className="border-b">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-8">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-9 w-2/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-80 max-w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="rounded-xl border bg-card divide-y">
            {[0, 1, 2].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-40 rounded bg-muted/70 animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Fallback genérico para demais rotas — evita "tela em branco" durante
  // o carregamento dos chunks lazy (ex.: pós-login indo para /dashboard).
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-6 shadow-lg">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Carregando...</p>
          <p className="text-xs text-muted-foreground mt-1">Aguarde um instante</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        defaultTheme="system"
        storageKey="smartapolice-theme"
        attribute="class"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <AuthProvider>
            <TenantProvider>
              <SessionTimeoutGuard>
                <BrowserRouter>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/status" element={<SystemStatusPage />} />
                      <Route path="/system-selection" element={<SystemSelection />} />
                      <Route path="/auth" element={<SystemSelection />} />
                      <Route path="/auth/smartapolice" element={<SmartApoliceAuth />} />
                      <Route path="/auth/smartbeneficios" element={<SmartBeneficiosAuthFunctional />} />
                      <Route path="/colaborador/solicitacao" element={<ColaboradorSolicitacao />} />
                      <Route path="/colaborador/:token" element={<ColaboradorFormPage />} />
                      <Route path="/solicitacao" element={<NewSolicitacaoPage />} />
                      <Route path="/solicitacao-frota/:token" element={<PublicFleetRequestPage />} />
                      <Route path="/rh/dashboard" element={<RHDashboard />} />
                      <Route path="/rh/colaboradores" element={<RHColaboradores />} />

                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/empresa/:empresaId"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminCompanyDetailsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/solicitacoes"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminRequestsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/aprovacoes"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminApprovalsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/perfil"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/email-settings"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminEmailSettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/webhooks"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminWebhooksPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/central-de-dados"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <CentralDeDadosPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/acessos"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminAccessLogsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/presenca"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminPresencePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/central"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                            <AdminCentralPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/inserir-veiculos"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'rh', 'corretora_admin']}>
                            <InserirVeiculosLotePage />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/consultoria-premium"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaListPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consultoria-premium/novo"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaNovoCasoPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consultoria-premium/configuracoes"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaConfigPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consultoria-premium/clientes"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaClientesPremiumPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consultoria-premium/parecer/:parecerId"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaParecerPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consultoria-premium/:casoId"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'corretora_admin']}>
                            <ConsultoriaCasoDetailPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="/dashboard" element={<AuthGuard />} />
                      <Route path="/smartbeneficios/dashboard" element={<SmartBeneficiosGuard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  
                </BrowserRouter>
              </SessionTimeoutGuard>
            </TenantProvider>
          </AuthProvider>
          <Toaster />
          <Sonner />
          <ProgressToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;