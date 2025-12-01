import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TermsAcceptanceState {
  isLoading: boolean;
  needsAcceptance: boolean;
  userId: string | null;
}

export function useTermsAcceptance() {
  const [state, setState] = useState<TermsAcceptanceState>({
    isLoading: true,
    needsAcceptance: false,
    userId: null,
  });

  const checkTermsAcceptance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setState({ isLoading: false, needsAcceptance: false, userId: null });
        return;
      }

      // Verificar se o usuário já aceitou os termos
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("termos_aceitos, termos_versao")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erro ao verificar termos:", error);
        // Se não encontrou profile, pode ser que ainda não foi criado
        setState({ isLoading: false, needsAcceptance: true, userId: user.id });
        return;
      }

      // Verificar se precisa aceitar (não aceitou ou versão diferente)
      const currentVersion = "1.0";
      const needsAcceptance = !profile?.termos_aceitos || profile?.termos_versao !== currentVersion;

      setState({
        isLoading: false,
        needsAcceptance,
        userId: user.id,
      });
    } catch (error) {
      console.error("Erro ao verificar termos:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const markTermsAccepted = () => {
    setState(prev => ({ ...prev, needsAcceptance: false }));
  };

  useEffect(() => {
    checkTermsAcceptance();

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        checkTermsAcceptance();
      } else if (event === "SIGNED_OUT") {
        setState({ isLoading: false, needsAcceptance: false, userId: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    ...state,
    markTermsAccepted,
    recheckTerms: checkTermsAcceptance,
  };
}
