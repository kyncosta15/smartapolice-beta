import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Ticket, TicketStatus } from '@/types/tickets';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, DollarSign, Tag, MapPin, User, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EditTicketModalProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTicketModal({ ticket, open, onOpenChange, onSuccess }: EditTicketModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subtipo: '',
    status: 'aberto' as TicketStatus,
    data_evento: new Date(),
    valor_estimado: '',
    localizacao: '',
    descricao: '',
    gravidade: 'media',
    numero_sinistro: '',
    subsidiaria: '',
    beneficiario_nome: '',
    prazo: null as Date | null,
    valor_pago: '',
    status_indenizacao: 'pendente',
  });

  useEffect(() => {
    if (ticket && open) {
      // Load extended fields from DB
      loadExtendedFields(ticket.id);
      
      setFormData(prev => ({
        ...prev,
        subtipo: ticket.subtipo || '',
        status: ticket.status,
        data_evento: ticket.data_evento ? parseISO(ticket.data_evento) : new Date(),
        valor_estimado: ticket.valor_estimado?.toString() || '',
        localizacao: ticket.localizacao || '',
        descricao: ticket.descricao || (ticket.payload?.descricao) || '',
        gravidade: ticket.gravidade || (ticket.payload?.gravidade) || 'media',
      }));
    }
  }, [ticket, open]);

  const loadExtendedFields = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('numero_sinistro, subsidiaria, beneficiario_nome, prazo, valor_pago, status_indenizacao')
        .eq('id', ticketId)
        .single();

      if (!error && data) {
        setFormData(prev => ({
          ...prev,
          numero_sinistro: data.numero_sinistro || '',
          subsidiaria: data.subsidiaria || '',
          beneficiario_nome: data.beneficiario_nome || '',
          prazo: data.prazo ? parseISO(data.prazo) : null,
          valor_pago: data.valor_pago?.toString() || '',
          status_indenizacao: data.status_indenizacao || 'pendente',
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar campos estendidos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsLoading(true);

    try {
      const previousStatus = ticket.status;
      const updateData: any = {
        subtipo: formData.subtipo || null,
        status: formData.status,
        data_evento: formData.data_evento.toISOString(),
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
        localizacao: formData.localizacao || null,
        numero_sinistro: formData.numero_sinistro || null,
        subsidiaria: formData.subsidiaria || null,
        beneficiario_nome: formData.beneficiario_nome || null,
        prazo: formData.prazo ? format(formData.prazo, 'yyyy-MM-dd') : null,
        valor_pago: formData.valor_pago ? parseFloat(formData.valor_pago) : null,
        status_indenizacao: formData.status_indenizacao || 'pendente',
        payload: {
          ...ticket.payload,
          descricao: formData.descricao,
          gravidade: formData.gravidade,
        },
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      if (previousStatus !== formData.status) {
        await supabase
          .from('ticket_movements')
          .insert({
            ticket_id: ticket.id,
            tipo: 'status_change',
            payload: {
              status_anterior: previousStatus,
              status_novo: formData.status,
              descricao: `Status alterado de "${previousStatus}" para "${formData.status}"`,
            },
          });
      }

      toast({
        title: 'Sucesso',
        description: 'Registro atualizado com sucesso!',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Erro ao atualizar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o registro.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subtipoOptions = ticket?.tipo === 'sinistro' 
    ? [
        { value: 'colisao', label: 'Colisão' },
        { value: 'roubo_furto', label: 'Roubo/Furto' },
        { value: 'incendio', label: 'Incêndio' },
        { value: 'danos_terceiros', label: 'Danos a Terceiros' },
        { value: 'perda_total', label: 'Perda Total' },
        { value: 'morte', label: 'Morte' },
        { value: 'invalidez_acidente', label: 'Invalidez Acidente' },
        { value: 'invalidez_doenca', label: 'Invalidez por Doença' },
        { value: 'outros', label: 'Outros' },
      ]
    : [
        { value: 'reboque', label: 'Reboque' },
        { value: 'pane_seca', label: 'Pane Seca' },
        { value: 'pneu_furado', label: 'Pneu Furado' },
        { value: 'chaveiro', label: 'Chaveiro' },
        { value: 'taxi', label: 'Táxi' },
        { value: 'guincho', label: 'Guincho' },
        { value: 'vidros', label: 'Vidros' },
        { value: 'outros', label: 'Outros' },
      ];

  const statusOptions = ticket?.tipo === 'sinistro'
    ? [
        { value: 'aberto', label: 'Aberto' },
        { value: 'analise_seguradora', label: 'Análise na Seguradora' },
        { value: 'aguardando_documento', label: 'Aguardando Documento' },
        { value: 'aguardando_vistoria', label: 'Aguardando Vistoria' },
        { value: 'na_oficina', label: 'Na Oficina' },
        { value: 'aguardando_peca', label: 'Aguardando Peça' },
        { value: 'aguardando_reparo', label: 'Aguardando Reparo' },
        { value: 'processo_liquidacao', label: 'Processo de Liquidação' },
        { value: 'carro_reserva', label: 'Carro Reserva' },
        { value: 'lucros_cessantes', label: 'Lucros Cessantes' },
        { value: 'dc_danos_corporais', label: 'DC - Danos Corporais' },
        { value: 'acordo', label: 'Acordo' },
        { value: 'finalizado_reparado', label: 'Finalizado Reparado' },
        { value: 'finalizado_com_indenizacao', label: 'Finalizado com Indenização' },
        { value: 'finalizado_sem_indenizacao', label: 'Finalizado sem Indenização' },
        { value: 'finalizado_inatividade', label: 'Finalizado (inatividade cor/seg)' },
        { value: 'cancelado', label: 'Cancelado' },
      ]
    : [
        { value: 'aberto', label: 'Aberto' },
        { value: 'atendimento_andamento', label: 'Atendimento em Andamento' },
        { value: 'saida_base', label: 'Saída de Base' },
        { value: 'aguardando_prestador', label: 'Aguardando Prestador' },
        { value: 'aguardando_vistoria', label: 'Aguardando Vistoria' },
        { value: 'aguardando_peca', label: 'Aguardando Peça' },
        { value: 'aguardando_documentos', label: 'Aguardando Documentos' },
        { value: 'aguardando_retorno', label: 'Aguardando Retorno (Segurado/Corretor)' },
        { value: 'aguardando_reparo', label: 'Aguardando Reparo' },
        { value: 'vidros', label: 'Vidros' },
        { value: 'reembolso', label: 'Reembolso' },
        { value: 'finalizado', label: 'Finalizado' },
        { value: 'finalizado_inatividade', label: 'Finalizado (inatividade cor/seg)' },
        { value: 'cancelado', label: 'Cancelado' },
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar {ticket?.tipo === 'sinistro' ? 'Sinistro' : 'Assistência'} #{ticket?.id?.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="subtipo">Categoria</Label>
            <Select
              value={formData.subtipo}
              onValueChange={(value) => setFormData({ ...formData, subtipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {subtipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
            >
              <SelectTrigger className={cn(
                formData.status === 'finalizado' && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                formData.status === 'cancelado' && 'border-red-500 bg-red-50 dark:bg-red-950/20'
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data do Evento */}
          <div className="space-y-2">
            <Label>Data do Evento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data_evento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_evento ? format(formData.data_evento, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.data_evento}
                  onSelect={(date) => date && setFormData({ ...formData, data_evento: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Gravidade */}
          {ticket?.tipo === 'sinistro' && (
            <div className="space-y-2">
              <Label htmlFor="gravidade">Gravidade</Label>
              <Select
                value={formData.gravidade}
                onValueChange={(value) => setFormData({ ...formData, gravidade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Valor Estimado */}
          <div className="space-y-2">
            <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
            <Input
              id="valor_estimado"
              type="number"
              step="0.01"
              value={formData.valor_estimado}
              onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value })}
              placeholder="0,00"
            />
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização</Label>
            <Input
              id="localizacao"
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Cidade, Estado ou endereço"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o ocorrido..."
              rows={3}
            />
          </div>

          {/* Separador - Campos do Sinistro/Beneficiário */}
          {ticket?.tipo === 'sinistro' && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                <span>Dados do Sinistro / Beneficiário</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nº do Sinistro */}
                <div className="space-y-2">
                  <Label htmlFor="numero_sinistro" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Nº do Sinistro (Seguradora)
                  </Label>
                  <Input
                    id="numero_sinistro"
                    value={formData.numero_sinistro}
                    onChange={(e) => setFormData({ ...formData, numero_sinistro: e.target.value })}
                    placeholder="Ex: 993/8664/2025"
                  />
                </div>

                {/* Subsidiária */}
                <div className="space-y-2">
                  <Label htmlFor="subsidiaria" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Subsidiária
                  </Label>
                  <Input
                    id="subsidiaria"
                    value={formData.subsidiaria}
                    onChange={(e) => setFormData({ ...formData, subsidiaria: e.target.value })}
                    placeholder="Ex: ESCAVE BA"
                  />
                </div>

                {/* Beneficiário */}
                <div className="space-y-2">
                  <Label htmlFor="beneficiario_nome" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nome do Beneficiário
                  </Label>
                  <Input
                    id="beneficiario_nome"
                    value={formData.beneficiario_nome}
                    onChange={(e) => setFormData({ ...formData, beneficiario_nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                {/* Prazo */}
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.prazo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.prazo ? format(formData.prazo, "PPP", { locale: ptBR }) : "Selecione o prazo"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.prazo || undefined}
                        onSelect={(date) => setFormData({ ...formData, prazo: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Valor Pago */}
                <div className="space-y-2">
                  <Label htmlFor="valor_pago" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Valor Pago / Indenizado (R$)
                  </Label>
                  <Input
                    id="valor_pago"
                    type="number"
                    step="0.01"
                    value={formData.valor_pago}
                    onChange={(e) => setFormData({ ...formData, valor_pago: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                {/* Status Indenização */}
                <div className="space-y-2">
                  <Label htmlFor="status_indenizacao">Status Indenização</Label>
                  <Select
                    value={formData.status_indenizacao}
                    onValueChange={(value) => setFormData({ ...formData, status_indenizacao: value })}
                  >
                    <SelectTrigger className={cn(
                      formData.status_indenizacao === 'indenizado' && 'border-green-500 bg-green-50 dark:bg-green-950/20',
                      formData.status_indenizacao === 'negado' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                      formData.status_indenizacao === 'pendente' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="indenizado">Indenizado</SelectItem>
                      <SelectItem value="negado">Negado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}