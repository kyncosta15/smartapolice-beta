
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingPage } from "@/components/LandingPage";
import { SystemSelection } from "@/components/SystemSelection";
import { SmartApoliceAuth } from "@/components/SmartApoliceAuth";
import { SmartBeneficiosAuthFunctional } from "@/components/SmartBeneficiosAuthFunctional";
import { SmartBeneficiosGuard } from "@/components/SmartBeneficiosGuard";
import { ColaboradorSolicitacao } from "@/components/ColaboradorSolicitacao";
import { ColaboradorFormPage } from "@/pages/ColaboradorFormPage";
import { ColaboradorFormSuccessPage } from "@/pages/ColaboradorFormSuccessPage";
import { NewSolicitacaoPage } from "@/pages/NewSolicitacaoPage";
import { AuthGuard } from "@/components/AuthGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/system-selection" element={<SystemSelection />} />
            <Route path="/auth/smartapolice" element={<SmartApoliceAuth />} />
            <Route path="/auth/smartbeneficios" element={<SmartBeneficiosAuthFunctional />} />
            <Route path="/dashboard" element={<AuthGuard />} />
            <Route path="/smartbeneficios/dashboard" element={<SmartBeneficiosGuard />} />
            <Route path="/colaborador/solicitacao" element={<ColaboradorSolicitacao />} />
            <Route path="/colaborador/:token" element={<ColaboradorFormPage />} />
            <Route path="/solicitacao" element={<NewSolicitacaoPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
