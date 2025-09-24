import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { FleetChangeRequest, FleetRequestFormData } from '@/types/fleet-requests';

export function useFleetRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FleetChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user?.company) return;

    try {
      setLoading(true);

      // Buscar empresa
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('fleet_change_requests')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []) as unknown as FleetChangeRequest[]);
    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.company, toast]);

  const submitRequest = useCallback(async (formData: FleetRequestFormData) => {
    if (!user?.company) throw new Error('Usuário não está associado a uma empresa');

    try {
      setSubmitting(true);

      // Buscar empresa
      const { data: empresa } = await supabase
        .from('empresas')  
        .select('id')
        .eq('nome', user.company)
        .single();

      if (!empresa) throw new Error('Empresa não encontrada');

      // Verificar se existe veículo com a placa/chassi informado
      let vehicleId = null;
      if (formData.placa || formData.chassi) {
        const query = supabase
          .from('frota_veiculos')
          .select('id, marca, modelo, ano_modelo, categoria')
          .eq('empresa_id', empresa.id);

        if (formData.placa) query.eq('placa', formData.placa);
        if (formData.chassi) query.eq('chassi', formData.chassi);

        const { data: vehicle } = await query.single();
        if (vehicle) {
          vehicleId = vehicle.id;
        }
      }

      // Preparar payload
      const payload: Record<string, any> = {
        motivo: formData.motivo,
      };

      if (formData.seguro) {
        payload.seguro = formData.seguro;
      }

      if (formData.responsavel) {
        payload.responsavel = formData.responsavel;
      }

      // Criar solicitação
      const { data: request, error: insertError } = await supabase
        .from('fleet_change_requests')
        .insert({
          empresa_id: empresa.id,
          user_id: user.id,
          vehicle_id: vehicleId,
          tipo: formData.tipo,
          placa: formData.placa,
          chassi: formData.chassi,
          renavam: formData.renavam,
          payload,
          anexos: [], // Will be updated after file upload
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload de arquivos se houver
      if (formData.anexos.length > 0) {
        const uploadedFiles = await uploadFiles(request.id, formData.anexos);
        
        // Atualizar solicitação com anexos
        const { error: updateError } = await supabase
          .from('fleet_change_requests')
          .update({ anexos: uploadedFiles })
          .eq('id', request.id);

        if (updateError) throw updateError;
      }

      // Enviar para webhook N8N
      await sendToWebhook(request.id);

      await fetchRequests();

      toast({
        title: 'Solicitação enviada com sucesso',
        description: 'Você pode acompanhar em Frotas → Solicitações',
      });

      return request as unknown as FleetChangeRequest;
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [user, toast, fetchRequests]);

  const uploadFiles = async (requestId: string, files: File[]) => {
    const uploadedFiles = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('solicitacoes-frota')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('solicitacoes-frota')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        name: file.name,
        url: publicUrl.publicUrl,
        size: file.size,
        type: file.type,
      });
    }

    return uploadedFiles;
  };

  const sendToWebhook = async (requestId: string) => {
    try {
      // Buscar dados completos da solicitação
      const { data: request } = await supabase
        .from('fleet_change_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) return;

      const requestData = request as unknown as FleetChangeRequest;

      const payload = {
        request_id: request.id,
        empresa_id: request.empresa_id,
        user_id: request.user_id,
        tipo: request.tipo,
        identificacao: {
          placa: request.placa,
          chassi: request.chassi,
          renavam: request.renavam,
        },
        payload: request.payload,
        anexos: request.anexos,
        created_at: request.created_at,
      };

      // Chamar edge function para webhook
      const { error } = await supabase.functions.invoke('fleet-request-webhook', {
        body: payload,
      });

      if (error) {
        console.error('Erro no webhook:', error);
        // Não falhar a solicitação por erro no webhook
      } else {
        // Atualizar status para em_triagem se webhook foi bem-sucedido
        await supabase
          .from('fleet_change_requests')
          .update({ status: 'em_triagem' })
          .eq('id', requestId);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    submitting,
    fetchRequests,
    submitRequest,
  };
}