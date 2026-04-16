import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFleetRequests } from '@/hooks/useFleetRequests';
import { useToast } from '@/hooks/use-toast';
import type { FleetChangeRequest } from '@/types/fleet-requests';

interface FleetRequestUnlockButtonProps {
  request: FleetChangeRequest;
}

export function FleetRequestUnlockButton({ request }: FleetRequestUnlockButtonProps) {
  const { unlockRequestWithCode } = useFleetRequests();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!['aberto', 'em_triagem'].includes(request.status)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      await unlockRequestWithCode(request.id, code);
      setCode('');
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Não foi possível liberar',
        description: error?.message ?? 'Código inválido.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <KeyRound className="h-4 w-4" />
          Liberar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-sm font-medium">Código de liberação admin</p>
            <p className="text-xs text-muted-foreground mt-1">
              Informe o código fornecido pelo admin para aprovar esta solicitação.
            </p>
          </div>
          <Input
            placeholder="Ex: ADM#XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            disabled={submitting}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !code.trim()}>
              {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Aprovar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
