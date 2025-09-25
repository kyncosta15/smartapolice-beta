import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function N8NTestEmpresaButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestEmpresa = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testando criação de empresa específica...');

      // Chamar a função de teste
      const { data, error } = await supabase.rpc('test_get_user_empresa');

      if (error) {
        console.error('❌ Erro na função RPC:', error);
        toast.error('Erro ao testar função RPC: ' + error.message);
        return;
      }

      console.log('✅ Resultado da função:', data);
      setResult(data);
      
      const resultData = data as any;
      if (resultData.success) {
        toast.success('Empresa criada/obtida com sucesso!');
        
        // Verificar se a empresa foi criada
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', resultData.empresa_id)
          .single();

        if (!empresaError && empresaData) {
          console.log('✅ Empresa confirmada no banco:', empresaData);
          
          // Verificar memberships
          const { data: memberships, error: memberError } = await supabase
            .from('user_memberships')
            .select('*')
            .eq('user_id', resultData.user_id)
            .eq('empresa_id', resultData.empresa_id);

          if (!memberError && memberships) {
            console.log('✅ Memberships criados:', memberships);
          }

          // Disparar evento para atualizar o dashboard
          window.dispatchEvent(new CustomEvent('profile-updated'));
        }
      } else {
        toast.error('Erro: ' + resultData.message);
      }
    } catch (err: any) {
      console.error('💥 Erro geral:', err);
      toast.error('Erro geral: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleTestEmpresa}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? '🔄 Testando...' : '🧪 Testar Empresa Específica'}
      </Button>

      {result && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Resultado do Teste:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}