import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DebugEmpresaButton = () => {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const handleDebug = async () => {
    try {
      setLoading(true);
      console.log('🔍 Executando debug da empresa...');
      
      const { data, error } = await supabase.rpc('debug_user_empresa_complete');
      
      if (error) {
        console.error('❌ Erro no debug:', error);
        toast.error(`Erro no debug: ${error.message}`);
        return;
      }

      console.log('✅ Debug concluído:', data);
      setDebugData(data);
      
      const resultado = data as any;
      if (resultado.success) {
        toast.success('Debug executado com sucesso!');
      } else {
        toast.error(`Erro: ${resultado.error}`);
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado no debug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleDebug}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? '🔍 Debugando...' : '🔍 Debug Empresa'}
      </Button>

      {debugData && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Debug Info - Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96 bg-gray-50 p-4 rounded">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};