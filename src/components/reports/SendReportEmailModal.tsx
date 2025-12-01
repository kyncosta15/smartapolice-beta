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
import { Loader2, Mail, Send, Calendar, Clock, Trash2, FileText, BarChart3, Shield, Lightbulb } from 'lucide-react';
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

  const reportFeatures = [
    { icon: BarChart3, label: 'KPIs de gestão de frotas' },
    { icon: FileText, label: 'Resumo de sinistros e assistências' },
    { icon: Shield, label: 'Status das apólices de benefícios' },
    { icon: Lightbulb, label: 'Insights automáticos do período' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            Relatório Executivo por Email
          </DialogTitle>
          <DialogDescription className="text-sm pt-2">
            Configure o envio automático do seu relatório executivo personalizado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Status do agendamento existente */}
            {existingSchedule && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">Agendamento ativo</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                        <Clock className="h-3 w-3" />
                        Próximo envio: {formatProximoEnvio(existingSchedule.proximo_envio)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSchedule}
                    disabled={isSaving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Configurações de envio */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">1</span>
                Configurações de envio
              </h3>
              
              <div className="grid gap-4 pl-8">
                {/* Email de destino */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email de destino</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSaving}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Frequência */}
                  <div className="space-y-2">
                    <Label className="text-sm">Frequência</Label>
                    <Select value={frequencia} onValueChange={setFrequencia} disabled={isSaving}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="7">Semanal</SelectItem>
                        <SelectItem value="15">Quinzenal</SelectItem>
                        <SelectItem value="30">Mensal</SelectItem>
                        <SelectItem value="60">Bimestral</SelectItem>
                        <SelectItem value="90">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dia do envio */}
                  <div className="space-y-2">
                    <Label className="text-sm">Dia do mês</Label>
                    <Select value={diaEnvio} onValueChange={setDiaEnvio} disabled={isSaving}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {[1, 5, 10, 15, 20, 25].map((dia) => (
                          <SelectItem key={dia} value={dia.toString()}>
                            Dia {dia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Informação sobre o relatório */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">2</span>
                Conteúdo do relatório
              </h3>
              
              <div className="bg-muted/50 rounded-xl p-4 pl-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <feature.icon className="h-4 w-4 text-primary/70 flex-shrink-0" />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleSendNow}
            disabled={isSaving || !email || isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Agora
          </Button>
          
          <Button 
            onClick={handleSaveSchedule} 
            disabled={isSaving || isLoading} 
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {existingSchedule ? 'Atualizar Agendamento' : 'Criar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
