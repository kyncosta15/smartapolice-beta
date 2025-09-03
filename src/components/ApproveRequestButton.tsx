import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

interface ApproveRequestButtonProps {
  requestId: string;
  requestStatus: string;
  protocolCode: string;
  userRole?: 'corretora_admin' | 'gestor_rh';
  onApproved?: () => void;
}

export function ApproveRequestButton({ 
  requestId, 
  requestStatus, 
  protocolCode,
  userRole = 'gestor_rh',
  onApproved 
}: ApproveRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  // Only show button for eligible statuses
  if (requestStatus !== 'recebido' && requestStatus !== 'em_validacao') {
    return null;
  }

  async function handleApprove() {
    if (!requestId) {
      toast({
        title: "Erro",
        description: "ID da solicitação não encontrado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log(`Approving request ${requestId} with protocol ${protocolCode}`);

    try {
      const { data, error } = await supabase.functions.invoke('rh-approve-request', {
        body: {
          requestId,
          note: note.trim() || undefined
        }
      });

      if (error) {
        console.error('Error calling approve function:', error);
        throw error;
      }

      if (!data?.ok) {
        throw new Error(data?.error?.message || 'Falha ao aprovar solicitação');
      }

      toast({
        title: "Sucesso!",
        description: `Ticket enviado ao backoffice. ${data.data?.external_ref ? `Referência: ${data.data.external_ref}` : ''}`,
      });

      // Clear the note
      setNote('');
      
      // Call callback if provided
      if (onApproved) {
        onApproved();
      }

      console.log(`Request ${requestId} approved successfully. Ticket ID: ${data.data?.ticketId}`);

    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Erro",
        description: error.message || 'Falha ao enviar ticket',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 p-4 border-t">
      <div className="space-y-2">
        <Label htmlFor="rh-note">
          {userRole === 'corretora_admin' 
            ? 'Observação para processamento do ticket (opcional)' 
            : 'Observação para o backoffice (opcional)'
          }
        </Label>
        <Textarea
          id="rh-note"
          placeholder={
            userRole === 'corretora_admin'
              ? "Digite observações para o processamento do ticket..."
              : "Digite observações para o time de processamento..."
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
        />
        {note.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {note.length}/2000 caracteres
          </p>
        )}
      </div>
      
      <Button
        onClick={handleApprove}
        disabled={loading}
        className="w-full"
        size="lg"
        variant={userRole === 'corretora_admin' ? 'default' : 'secondary'}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {userRole === 'corretora_admin' ? 'Criando ticket...' : 'Enviando...'}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {userRole === 'corretora_admin' ? 'Criar Ticket' : 'Aprovar e Enviar'}
          </>
        )}
      </Button>
    </div>
  );
}