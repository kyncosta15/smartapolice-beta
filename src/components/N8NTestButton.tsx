import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { testN8NDataProcessing, limparDadosTeste } from '@/services/testN8NUpload';

export function N8NTestButton() {
  const [isTestingUpload, setIsTestingUpload] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTestingEmpresa, setIsTestingEmpresa] = useState(false);

  const handleTestEmpresa = async () => {
    setIsTestingEmpresa(true);
    try {
      console.log('🔧 Testando função get_user_empresa_id...');
      
      const { data, error } = await supabase.rpc('test_get_user_empresa');
      
      if (error) {
        console.error('❌ Erro ao testar função:', error);
        toast.error('❌ Erro: ' + error.message);
      } else {
        console.log('✅ Resultado da função:', data);
        if (data.success) {
          toast.success(`✅ Empresa criada: ${data.empresa_id}`);
        } else {
          toast.error(`❌ Falha: ${data.message || data.error}`);
        }
      }
    } catch (err) {
      console.error('💥 Erro geral:', err);
      toast.error('💥 Erro: ' + (err as Error).message);
    } finally {
      setIsTestingEmpresa(false);
    }
  };

  const handleTestUpload = async () => {
    setIsTestingUpload(true);
    try {
      const result = await testN8NDataProcessing();
      
      if (result.success) {
        toast.success(`✅ Teste concluído! ${result.sucessos} veículos inseridos na empresa: ${result.empresaNome}`);
      } else {
        toast.error(`❌ Falha no teste: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`💥 Erro no teste: ${error.message}`);
    } finally {
      setIsTestingUpload(false);
    }
  };

  const handleClearTest = async () => {
    setIsClearing(true);
    try {
      const result = await limparDadosTeste();
      
      if (result.success) {
        toast.success('🗑️ Dados de teste removidos com sucesso');
      } else {
        toast.error(`❌ Erro ao limpar: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`💥 Erro ao limpar: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-blue-50 rounded-lg border">
      <div className="flex-1">
        <h3 className="font-semibold text-blue-900 mb-2">🧪 Teste N8N</h3>
        <p className="text-sm text-blue-700 mb-3">
          Simula o processamento dos dados que você enviou via N8N para verificar se a nova lógica de empresas individuais está funcionando.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleTestEmpresa}
          disabled={isTestingEmpresa}
          variant="secondary"
          size="sm"
        >
          {isTestingEmpresa ? '⚙️ Testando...' : '⚙️ Teste Empresa'}
        </Button>
        <Button 
          onClick={handleTestUpload}
          disabled={isTestingUpload}
          variant="default"
          size="sm"
        >
          {isTestingUpload ? '🔄 Testando...' : '🧪 Testar Upload'}
        </Button>
        <Button 
          onClick={handleClearTest}
          disabled={isClearing}
          variant="outline"
          size="sm"
        >
          {isClearing ? '🗑️ Limpando...' : '🗑️ Limpar Teste'}
        </Button>
      </div>
    </div>
  );
}