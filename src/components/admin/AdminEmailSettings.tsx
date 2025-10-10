import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Calendar, Send, Trash2, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportSchedule {
  id: string;
  empresa_id: string;
  email: string;
  nome_destinatario: string;
  frequencia_dias: number;
  dia_envio: number;
  ativo: boolean;
  ultimo_envio: string | null;
  proximo_envio: string | null;
  created_at: string;
  empresas?: {
    nome: string;
  };
}

interface ReportSend {
  id: string;
  email: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  empresas?: {
    nome: string;
  };
}

export function AdminEmailSettings() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [sends, setSends] = useState<ReportSend[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Formulário
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    empresa_id: "",
    email: "",
    nome_destinatario: "",
    frequencia_dias: 30,
    dia_envio: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar agendamentos
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("report_schedules")
        .select(`
          *,
          empresas:empresa_id (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (schedulesError) throw schedulesError;
      setSchedules(schedulesData || []);

      // Carregar histórico de envios
      const { data: sendsData, error: sendsError } = await supabase
        .from("report_sends")
        .select(`
          *,
          empresas:empresa_id (
            nome
          )
        `)
        .order("sent_at", { ascending: false })
        .limit(50);

      if (sendsError) throw sendsError;
      setSends(sendsData || []);

      // Carregar empresas
      const { data: empresasData, error: empresasError } = await supabase
        .from("empresas")
        .select("id, nome")
        .order("nome");

      if (empresasError) throw empresasError;
      setEmpresas(empresasData || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("report_schedules").insert({
        ...formData,
        ativo: true,
      });

      if (error) throw error;

      toast({
        title: "Agendamento criado",
        description: "O relatório será enviado automaticamente.",
      });

      setShowForm(false);
      setFormData({
        empresa_id: "",
        email: "",
        nome_destinatario: "",
        frequencia_dias: 30,
        dia_envio: 1,
      });
      loadData();
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("report_schedules")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Agendamento desativado" : "Agendamento ativado",
      });

      loadData();
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Deseja realmente excluir este agendamento?")) return;

    try {
      const { error } = await supabase.from("report_schedules").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Agendamento excluído",
      });

      loadData();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testSendNow = async () => {
    try {
      setSending(true);

      const { data, error } = await supabase.functions.invoke("send-scheduled-reports");

      if (error) throw error;

      toast({
        title: "Envio disparado",
        description: `${data?.processed || 0} relatórios processados`,
      });

      loadData();
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Envio Automático de Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Configure relatórios executivos periódicos por email
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testSendNow} disabled={sending} variant="outline">
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Enviando..." : "Testar Envio"}
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Agendamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Select value={formData.empresa_id} onValueChange={(v) => setFormData({ ...formData, empresa_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select
                    value={formData.frequencia_dias.toString()}
                    onValueChange={(v) => setFormData({ ...formData, frequencia_dias: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">A cada 30 dias</SelectItem>
                      <SelectItem value="60">A cada 60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Destinatário</Label>
                  <Input
                    id="nome"
                    value={formData.nome_destinatario}
                    onChange={(e) => setFormData({ ...formData, nome_destinatario: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dia">Dia do Mês para Envio (1-28)</Label>
                <Input
                  id="dia"
                  type="number"
                  min="1"
                  max="28"
                  value={formData.dia_envio}
                  onChange={(e) => setFormData({ ...formData, dia_envio: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Agendamento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Agendamentos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum agendamento configurado
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{schedule.email}</span>
                      <Badge variant={schedule.ativo ? "default" : "secondary"}>
                        {schedule.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.empresas?.nome} • A cada {schedule.frequencia_dias} dias • Dia {schedule.dia_envio}
                    </p>
                    {schedule.proximo_envio && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Próximo envio: {format(new Date(schedule.proximo_envio), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSchedule(schedule.id, schedule.ativo)}
                    >
                      {schedule.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Histórico de Envios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum envio registrado
            </p>
          ) : (
            <div className="space-y-2">
              {sends.map((send) => (
                <div
                  key={send.id}
                  className="flex items-center justify-between p-3 border rounded-lg text-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{send.email}</span>
                      {getStatusBadge(send.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {send.empresas?.nome} • {format(new Date(send.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    {send.error_message && (
                      <p className="text-xs text-red-500 mt-1">{send.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}