import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const LimparDadosButton = () => {
  const [loading, setLoading] = useState(false);

  const handleLimpeza = async () => {
    try {
      setLoading(true);
      console.log('🗑️ Limpando dados do usuário...');
      
      const { data, error } = await supabase.rpc('limpar_dados_usuario_teste');
      
      if (error) {
        console.error('❌ Erro na limpeza:', error);
        toast.error(`Erro na limpeza: ${error.message}`);
        return;
      }

      console.log('✅ Limpeza concluída:', data);
      
      const resultado = data as any;
      if (resultado.success) {
        toast.success(`Limpeza realizada! Veículos: ${resultado.veiculos_deletados}, Memberships: ${resultado.memberships_deletadas}, Empresas: ${resultado.empresas_deletadas}`);
        
        // Recarregar a página para atualizar o estado
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`Erro: ${resultado.error}`);
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado na limpeza');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive"
          size="sm"
          disabled={loading}
        >
          {loading ? '🗑️ Limpando...' : '🗑️ Limpar Dados'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Limpeza de Dados</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá deletar TODOS os dados relacionados ao seu usuário:
            <br />- Todos os veículos da sua empresa
            <br />- Suas associações de empresa (memberships)
            <br />- Sua empresa específica
            <br /><br />
            <strong>Esta ação não pode ser desfeita!</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLimpeza} className="bg-destructive text-destructive-foreground">
            Sim, Limpar Tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};