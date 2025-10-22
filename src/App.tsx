import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProgressToaster } from "@/components/ui/progress-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { LandingPage } from "@/components/LandingPage";

// Protected and Auth components
import ProtectedRoute from '@/components/ProtectedRoute';
import SystemSelection from "@/components/SystemSelection";
import SmartApoliceAuth from "@/components/SmartApoliceAuth";
import SmartBeneficiosAuthFunctional from "@/components/SmartBeneficiosAuthFunctional";
import SmartBeneficiosGuard from "@/components/SmartBeneficiosGuard";
import ColaboradorSolicitacao from "@/components/ColaboradorSolicitacao";
import ColaboradorFormPage from "@/pages/ColaboradorFormPage";
import NewSolicitacaoPage from "@/pages/NewSolicitacaoPage";
import PublicFleetRequestPage from "@/pages/PublicFleetRequestPage";
import AuthGuard from "@/components/AuthGuard";
import NotFound from "./pages/NotFound";
import RHDashboard from './pages/RHDashboard';
import RHColaboradores from './pages/RHColaboradores';
import AdminApprovalsPage from './pages/AdminApprovalsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminCompanyDetailsPage from './pages/AdminCompanyDetailsPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminEmailSettingsPage from './pages/AdminEmailSettingsPage';
import InserirVeiculosLotePage from './pages/InserirVeiculosLotePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

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
            <BrowserRouter>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
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
              
              {/* Admin routes */}
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
                path="/admin/inserir-veiculos"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'administrador', 'rh', 'corretora_admin']}>
                    <InserirVeiculosLotePage />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<AuthGuard />} />
              <Route
                path="/smartbeneficios/dashboard"
                element={<SmartBeneficiosGuard />}
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
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