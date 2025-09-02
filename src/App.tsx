
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LandingPage } from "@/components/LandingPage";
import { SystemSelection } from "@/components/SystemSelection";
import { SmartApoliceAuth } from "@/components/SmartApoliceAuth";
import { SmartBeneficiosAuth } from "@/components/SmartBeneficiosAuth";
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
            <Route path="/auth/smartbeneficios" element={<SmartBeneficiosAuth />} />
            <Route path="/dashboard" element={<AuthGuard />} />
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
