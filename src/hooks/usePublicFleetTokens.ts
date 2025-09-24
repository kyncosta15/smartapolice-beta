import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePublicFleetTokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generatePublicLink = useCallback(async (validityDays: number = 7) => {
    if (!user?.company) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    try {
      setGenerating(true);

      // Buscar empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) throw new Error('Empresa não encontrada');

      // Gerar token único
      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      // Salvar token no banco
      const { data, error } = await supabase
        .from('public_fleet_tokens')
        .insert({
          token,
          empresa_id: empresa.id,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Construir URL pública
      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/solicitacao-frota/${token}`;
      
      // Criar mensagem para WhatsApp
      const whatsappMessage = encodeURIComponent(
        `🚗 *Solicitação de Alteração de Frota*\n\n` +
        `Você pode solicitar alterações na frota através deste link:\n\n` +
        `${publicUrl}\n\n` +
        `⏰ Link válido até ${expiresAt.toLocaleDateString('pt-BR')}\n\n` +
        `_Link gerado por: ${user.name}_`
      );

      const result = {
        link: publicUrl,
        whatsappMessage: `https://wa.me/?text=${whatsappMessage}`,
        expiresAt: expiresAt.toISOString(),
        token,
      };

      toast({
        title: 'Link gerado com sucesso!',
        description: `Link válido até ${expiresAt.toLocaleDateString('pt-BR')}`,
      });

      return result;
    } catch (error: any) {
      console.error('Erro ao gerar link:', error);
      toast({
        title: 'Erro ao gerar link',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setGenerating(false);
    }
  }, [user, toast]);

  return {
    generatePublicLink,
    generating,
  };
}

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const timestamp = Date.now().toString(36);
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${timestamp}-${result}`;
}