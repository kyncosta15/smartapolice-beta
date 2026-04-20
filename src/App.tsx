import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProgressToaster } from "@/components/ui/progress-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SessionTimeoutGuard from '@/components/SessionTimeoutGuard';
import { SystemStatusBanner } from '@/components/SystemStatusBanner';
import { SystemStatusIndicator } from '@/components/SystemStatusIndicator';

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
const SystemStatusPage = lazy(() => import('./pages/SystemStatusPage'));

// Pré-carrega o chunk da página de status assim que o app monta —
// elimina o "tela em branco" ao clicar no link de status.
if (typeof window !== 'undefined') {
  const prefetch = () => import('./pages/SystemStatusPage');
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
  } else {
    setTimeout(prefetch, 1500);
  }
}

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

  // Para outras rotas, não exibimos fallback global — mantém o comportamento
  // anterior em que a navegação acontece sem uma tela intermediária de "Carregando…".
  return null;
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
                  {!window.location.pathname.startsWith('/status') && <SystemStatusBanner />}
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
                        path="/admin/inserir-veiculos"
                        element={
                          <ProtectedRoute requiredRoles={['admin', 'administrador', 'rh', 'corretora_admin']}>
                            <InserirVeiculosLotePage />
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

const SystemStatusIndicatorSlot = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/status')) return null;
  return (
    <div className="fixed bottom-3 right-3 z-40">
      <SystemStatusIndicator />
    </div>
  );
};

export default App;