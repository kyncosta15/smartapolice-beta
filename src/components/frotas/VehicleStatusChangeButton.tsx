import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useInsuranceApprovals } from '@/hooks/useInsuranceApprovals';
import { RequestInsuranceModal } from '@/components/insurance/RequestInsuranceModal';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VehicleStatusChangeButtonProps {
  veiculo: {
    id: string;
    placa: string;
    marca?: string;
    modelo?: string;
    status_seguro: string;
    empresa_id: string;
  };
  onUpdate?: () => void;
}

export function VehicleStatusChangeButton({ veiculo, onUpdate }: VehicleStatusChangeButtonProps) {
  const { profile } = useUserProfile();
  const { createRequest } = useInsuranceApprovals();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = profile?.is_admin === true;
  const canRequestChange = veiculo.status_seguro?.toLowerCase() === 'sem_seguro' || 
                           veiculo.status_seguro?.toLowerCase() === 'sem seguro';

  if (!canRequestChange) {
    return null;
  }

  const handleDirectChange = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('frota_veiculos')
        .update({ 
          status_seguro: 'segurado',
          updated_at: new Date().toISOString()
        })
        .eq('id', veiculo.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O veículo foi marcado como segurado.',
      });

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do veículo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async (params: any) => {
    const success = await createRequest(params);
    if (success) {
      onUpdate?.();
    }
    return success;
  };

  if (isAdmin) {
    return (
      <Button
        size="sm"
        onClick={handleDirectChange}
        disabled={loading}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {loading ? 'Atualizando...' : 'Marcar como Segurado'}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowModal(true)}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Solicitar Mudança
      </Button>

      <RequestInsuranceModal
        open={showModal}
        onOpenChange={setShowModal}
        veiculo={veiculo}
        empresaId={veiculo.empresa_id}
        onSubmit={handleRequestChange}
      />
    </>
  );
}
