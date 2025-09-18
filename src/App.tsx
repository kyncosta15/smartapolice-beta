import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { LandingPage } from "@/components/LandingPage";

// Lazy load heavy components to reduce initial bundle size
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));
const SystemSelection = lazy(() => import("@/components/SystemSelection").then(m => ({ default: m.SystemSelection })));
const SmartApoliceAuth = lazy(() => import("@/components/SmartApoliceAuth").then(m => ({ default: m.SmartApoliceAuth })));
const SmartBeneficiosAuthFunctional = lazy(() => import("@/components/SmartBeneficiosAuthFunctional").then(m => ({ default: m.SmartBeneficiosAuthFunctional })));
const SmartBeneficiosGuard = lazy(() => import("@/components/SmartBeneficiosGuard").then(m => ({ default: m.SmartBeneficiosGuard })));
const ColaboradorSolicitacao = lazy(() => import("@/components/ColaboradorSolicitacao").then(m => ({ default: m.ColaboradorSolicitacao })));
const ColaboradorFormPage = lazy(() => import("@/pages/ColaboradorFormPage").then(m => ({ default: m.ColaboradorFormPage })));
const NewSolicitacaoPage = lazy(() => import("@/pages/NewSolicitacaoPage").then(m => ({ default: m.NewSolicitacaoPage })));
const AuthGuard = lazy(() => import("@/components/AuthGuard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RHDashboard = lazy(() => import('./pages/RHDashboard'));
const RHColaboradores = lazy(() => import('./pages/RHColaboradores'));

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/rh/dashboard" element={<RHDashboard />} />
                <Route path="/rh/colaboradores" element={<RHColaboradores />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<AuthGuard />} />
                <Route
                  path="/smartbeneficios/dashboard"
                  element={<SmartBeneficiosGuard />}
                />

                {/* Admin only routes (future) */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requiredRoles={['admin', 'administrador']}>
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                        <p className="text-muted-foreground mt-2">Em breve...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;