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
import { Monitor, Smartphone, Laptop, Globe, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PresenceNameModalProps {
  open: boolean;
  onSetName: (name: string) => Promise<boolean>;
  userAgent?: string;
}

export function PresenceNameModal({ open, onSetName, userAgent }: PresenceNameModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const detectDeviceType = () => {
    const ua = (userAgent || navigator.userAgent).toLowerCase();
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
    
    if (!displayName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para identificar este acesso",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await onSetName(displayName.trim());
      
      if (success) {
        toast({
          title: "Identificação salva",
          description: `Você será identificado como "${displayName}" neste dispositivo`,
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar a identificação",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao salvar nome:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a identificação",
        variant: "destructive",
      });
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
            Identificamos um acesso de um novo local/dispositivo. Por favor, informe como você quer ser identificado.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
          <div className="bg-primary/10 rounded-full p-3">
            <DeviceIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{device.label}</p>
            <p className="text-xs text-muted-foreground">
              Primeiro acesso deste dispositivo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Como você quer ser identificado?
            </Label>
            <Input
              id="display-name"
              placeholder="Ex: Matheus do Financeiro"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Este nome aparecerá no painel de monitoramento e ajuda a identificar seus acessos
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !displayName.trim()}
          >
            {isLoading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
