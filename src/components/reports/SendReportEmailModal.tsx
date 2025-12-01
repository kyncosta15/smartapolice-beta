import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Send, Calendar, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SendReportEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExistingSchedule {
  id: string;
  email: string;
  frequencia_dias: number;
  dia_envio: number;
  ativo: boolean;
  proximo_envio: string | null;
}

export function SendReportEmailModal({ open, onOpenChange }: SendReportEmailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [frequencia, setFrequencia] = useState<string>('30'); // dias
  const [diaEnvio, setDiaEnvio] = useState<string>('1');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingSchedule, setExistingSchedule] = useState<ExistingSchedule | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // Carregar agendamento existente
  useEffect(() => {
    if (open && user?.id) {
      loadExistingSchedule();
    }
  }, [open, user?.id]);

  const loadExistingSchedule = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Buscar empresa do usuário
      const { data: membership } = await supabase
        .from('user_memberships')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (membership?.empresa_id) {
        setEmpresaId(membership.empresa_id);

        // Buscar agendamento existente
        const { data: schedule } = await supabase
          .from('report_schedules')
          .select('*')
          .eq('empresa_id', membership.empresa_id)
          .eq('created_by', user.id)
          .single();

        if (schedule) {
          setExistingSchedule(schedule);
          setEmail(schedule.email);
          setFrequencia(schedule.frequencia_dias.toString());
          setDiaEnvio(schedule.dia_envio.toString());
        } else {
          // Pré-preencher com email do usuário
          setEmail(user.email || '');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe o email de destino.",
        variant: "destructive"
      });
      return;
    }

    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada. Entre em contato com o suporte.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Calcular próximo envio baseado na frequência
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      const diaEnvioNum = parseInt(diaEnvio);
      let proximoEnvio = new Date(hoje);

      if (diaAtual >= diaEnvioNum) {
        // Próximo mês
        proximoEnvio.setMonth(proximoEnvio.getMonth() + 1);
      }
      proximoEnvio.setDate(diaEnvioNum);

      const scheduleData = {
        empresa_id: empresaId,
        email,
        nome_destinatario: user?.email?.split('@')[0] || 'Cliente',
        frequencia_dias: parseInt(frequencia),
        dia_envio: parseInt(diaEnvio),
        ativo: true,
        proximo_envio: proximoEnvio.toISOString(),
        created_by: user?.id
      };

      if (existingSchedule) {
        // Atualizar agendamento existente
        const { error } = await supabase
          .from('report_schedules')
          .update(scheduleData)
          .eq('id', existingSchedule.id);

        if (error) throw error;

        toast({
          title: "Agendamento atualizado!",
          description: `Você receberá o relatório a cada ${frequencia} dias no email ${email}.`,
        });
      } else {
        // Criar novo agendamento
        const { error } = await supabase
          .from('report_schedules')
          .insert(scheduleData);

        if (error) throw error;

        toast({
          title: "Agendamento criado!",
          description: `Você receberá o relatório a cada ${frequencia} dias no email ${email}.`,
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o agendamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!existingSchedule) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', existingSchedule.id);

      if (error) throw error;

      toast({
        title: "Agendamento removido",
        description: "Você não receberá mais relatórios automáticos.",
      });

      setExistingSchedule(null);
      setEmail(user?.email || '');
      setFrequencia('30');
      setDiaEnvio('1');
    } catch (error: any) {
      console.error('Erro ao remover agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o agendamento.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!email || !empresaId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('send-scheduled-reports', {
        body: { force: true, empresaId, emailOverride: email }
      });

      if (error) throw error;

      toast({
        title: "Relatório enviado!",
        description: `O relatório foi enviado para ${email}.`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar o relatório agora.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatProximoEnvio = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Relatório por Email
          </DialogTitle>
          <DialogDescription>
            Configure o envio automático do relatório executivo por email.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
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
                disabled={isSaving}
              />
            </div>

            {/* Frequência */}
            <div className="grid gap-2">
              <Label>Frequência de envio</Label>
              <Select value={frequencia} onValueChange={setFrequencia} disabled={isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Semanal (7 dias)</SelectItem>
                  <SelectItem value="15">Quinzenal (15 dias)</SelectItem>
                  <SelectItem value="30">Mensal (30 dias)</SelectItem>
                  <SelectItem value="60">Bimestral (60 dias)</SelectItem>
                  <SelectItem value="90">Trimestral (90 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dia do envio */}
            <div className="grid gap-2">
              <Label>Dia do envio</Label>
              <Select value={diaEnvio} onValueChange={setDiaEnvio} disabled={isSaving}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 5, 10, 15, 20, 25].map((dia) => (
                    <SelectItem key={dia} value={dia.toString()}>
                      Dia {dia} do mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status do agendamento existente */}
            {existingSchedule && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                  <Calendar className="h-4 w-4" />
                  Agendamento ativo
                </div>
                <div className="flex items-center gap-2 text-green-600 text-xs">
                  <Clock className="h-3 w-3" />
                  Próximo envio: {formatProximoEnvio(existingSchedule.proximo_envio)}
                </div>
              </div>
            )}

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
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {existingSchedule && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSchedule}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Cancelar Agendamento
            </Button>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleSendNow}
              disabled={isSaving || !email}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Agora
            </Button>
            
            <Button onClick={handleSaveSchedule} disabled={isSaving || isLoading} className="flex-1 sm:flex-none">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              {existingSchedule ? 'Atualizar' : 'Agendar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
