import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Smartphone, Laptop, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewAccessModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  ipAddress: string;
  userAgent: string;
}

export function NewAccessModal({ open, onClose, userId, ipAddress, userAgent }: NewAccessModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const detectDeviceType = () => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return { icon: Smartphone, label: 'Celular' };
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return { icon: Laptop, label: 'Tablet' };
    }
    return { icon: Monitor, label: 'Computador' };
  };

  const device = detectDeviceType();
  const DeviceIcon = device.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para identificar este acesso",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_access_logs')
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          device_name: deviceName.trim(),
          user_agent: userAgent,
        });

      if (error) throw error;

      toast({
        title: "Acesso registrado",
        description: `Este dispositivo foi identificado como "${deviceName}"`,
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar acesso:', error);
      toast({
        title: "Erro ao registrar",
        description: error.message || "Não foi possível registrar o acesso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_access_logs')
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          device_name: `${device.label} - ${new Date().toLocaleDateString('pt-BR')}`,
          user_agent: userAgent,
        });

      if (error) throw error;
      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar acesso:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Novo acesso detectado
          </DialogTitle>
          <DialogDescription>
            Identificamos um acesso de um novo local. Por favor, dê um nome para identificar este dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
          <div className="bg-primary/10 rounded-full p-3">
            <DeviceIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{device.label}</p>
            <p className="text-xs text-muted-foreground font-mono">{ipAddress}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-name">Nome do dispositivo/local</Label>
            <Input
              id="device-name"
              placeholder="Ex: Meu computador do trabalho"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Isso ajuda a identificar seus acessos posteriormente
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Pular
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
