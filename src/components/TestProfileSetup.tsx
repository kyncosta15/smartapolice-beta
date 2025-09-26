import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileAndCompany } from "@/utils/profileUtils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function TestProfileSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSetup = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await ensureProfileAndCompany(supabase);
      
      setResult(result);
      
      toast({
        title: "✅ Sucesso!",
        description: `Perfil e empresa configurados com sucesso! Empresa ID: ${result.empresa_id}`,
      });
    } catch (error: any) {
      console.error("Erro ao configurar perfil:", error);
      toast({
        title: "❌ Erro",
        description: `Falha na configuração: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>🔧 Teste de Configuração</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Teste a função ensureProfileAndCompany para garantir que o usuário tem perfil e empresa configurados corretamente.
        </p>
        
        <Button
          onClick={testSetup}
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? "Configurando..." : "Configurar Perfil & Empresa"}
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
            <div className="font-semibold text-green-800">✅ Configuração bem-sucedida:</div>
            <div>User ID: {result.user.id}</div>
            <div>Email: {result.user.email}</div>
            <div className="font-medium">Empresa ID: {result.empresa_id}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}