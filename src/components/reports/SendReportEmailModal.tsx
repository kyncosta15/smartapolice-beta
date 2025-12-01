import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2, Mail, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SendReportEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendReportEmailModal({ open, onOpenChange }: SendReportEmailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSending, setIsSending] = useState(false);

  const handleSendReport = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email de destino.",
        variant: "destructive"
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Período obrigatório",
        description: "Por favor, selecione o período do relatório.",
        variant: "destructive"
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: "Período inválido",
        description: "A data inicial não pode ser maior que a data final.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-report-email', {
        body: {
          email,
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          userId: user?.id
        }
      });

      if (error) {
        console.error('Erro ao enviar relatório:', error);
        throw error;
      }

      toast({
        title: "Relatório enviado!",
        description: `O relatório foi enviado com sucesso para ${email}.`,
      });

      // Limpar formulário e fechar modal
      setEmail('');
      setStartDate(undefined);
      setEndDate(undefined);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Relatório por Email
          </DialogTitle>
          <DialogDescription>
            Selecione o período e o email de destino para enviar o relatório executivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Email de destino */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email de destino</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>

          {/* Período */}
          <div className="grid gap-2">
            <Label>Período do Relatório</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Data inicial */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={isSending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {/* Data final */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={isSending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Informação sobre o relatório */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">O relatório incluirá:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>KPIs de gestão de frotas</li>
              <li>Resumo de sinistros e assistências</li>
              <li>Status das apólices de benefícios</li>
              <li>Insights automáticos do período</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSendReport} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Relatório
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
