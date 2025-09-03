import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/pages/AuthPage';
import { LandingPage } from "@/components/LandingPage";
import { SystemSelection } from "@/components/SystemSelection";
import { SmartApoliceAuth } from "@/components/SmartApoliceAuth";
import { SmartBeneficiosAuthFunctional } from "@/components/SmartBeneficiosAuthFunctional";
import { SmartBeneficiosGuard } from "@/components/SmartBeneficiosGuard";
import { ColaboradorSolicitacao } from "@/components/ColaboradorSolicitacao";
import { ColaboradorFormPage } from "@/pages/ColaboradorFormPage";
import { NewSolicitacaoPage } from "@/pages/NewSolicitacaoPage";
import { AuthGuard } from "@/components/AuthGuard";
import NotFound from "./pages/NotFound";
import Index from './pages/Index';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/system-selection" element={<SystemSelection />} />
              <Route path="/auth/smartapolice" element={<SmartApoliceAuth />} />
              <Route path="/auth/smartbeneficios" element={<SmartBeneficiosAuthFunctional />} />
              <Route path="/colaborador/solicitacao" element={<ColaboradorSolicitacao />} />
              <Route path="/colaborador/:token" element={<ColaboradorFormPage />} />
              <Route path="/solicitacao" element={<NewSolicitacaoPage />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<AuthGuard />} />
              <Route
                path="/smartbeneficios/dashboard"
                element={
                  <ProtectedRoute requiredRoles={['rh', 'admin', 'administrador', 'financeiro', 'corretora_admin']}>
                    <SmartBeneficiosGuard />
                  </ProtectedRoute>
                }
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
          </BrowserRouter>
        </AuthProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;