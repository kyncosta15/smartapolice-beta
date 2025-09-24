export type TicketType = 'sinistro' | 'assistencia';

export type StatusStage = 'abertura' | 'analise' | 'execucao' | 'finalizacao' | 'encerrado';

export interface StatusStep {
  key: string;
  label: string;
  stage: StatusStage;
  icon?: React.ReactNode;
}

export interface StatusEvent {
  id: string;
  ticket_id: string;
  from_status?: string;
  to_status: string;
  note?: string;
  attachments?: { name: string; url: string; size: number }[];
  changed_by: string;
  created_at: string;
  user_name?: string;
}

export interface StatusStepperProps {
  type: TicketType;
  currentStatus: string;
  steps: StatusStep[];
  history: StatusEvent[];
  onChangeStatus?: (nextStatus: string, note?: string, attachments?: File[]) => Promise<void>;
  readOnly?: boolean;
  slaInfo?: {
    due_at?: string;
    isOverdue?: boolean;
  };
}

export interface StatusHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStep: StatusStep | null;
  history: StatusEvent[];
  onChangeStatus?: (status: string, note?: string, attachments?: File[]) => Promise<void>;
  readOnly?: boolean;
  currentStatus: string;
}

export interface MiniStepperProps {
  type: TicketType;
  currentStatus: string;
  steps: StatusStep[];
  className?: string;
}

// Mapeamento de status para rótulos em português
export const SINISTRO_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  analise_seguradora: 'Análise na Seguradora',
  aguardando_vistoria: 'Aguardando Vistoria',
  aguardando_documento: 'Aguardando Documento',
  na_oficina: 'Na Oficina',
  aguardando_peca: 'Aguardando Peça',
  aguardando_reparo: 'Aguardando Reparo',
  carro_reserva: 'Carro Reserva',
  processo_liquidacao: 'Processo de Liquidação',
  acordo: 'Acordo',
  lucros_cessantes: 'Lucros Cessantes',
  dc_danos_corporais: 'DC - Danos Corporais',
  finalizado_reparado: 'Finalizado Reparado',
  finalizado_sem_indenizacao: 'Finalizado sem Indenização',
  finalizado_com_indenizacao: 'Finalizado com Indenização',
  finalizado_inatividade: 'Finalizado (inatividade cor/seg)'
};

export const ASSISTENCIA_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  atendimento_andamento: 'Atendimento em Andamento',
  saida_de_base: 'Saída de Base',
  aguardando_prestador: 'Aguardando Prestador',
  aguardando_vistoria: 'Aguardando Vistoria',
  aguardando_peca: 'Aguardando Peça',
  aguardando_documentos: 'Aguardando Documentos',
  aguardando_reparo: 'Aguardando Reparo',
  reembolso: 'Reembolso',
  vidros: 'Vidros',
  aguardando_retorno: 'Aguardando Retorno (Segurado/Corretor)',
  finalizado_inatividade: 'Finalizado (inatividade cor/seg)',
  finalizado: 'Finalizado'
};

// Definição dos passos para cada tipo
export const SINISTRO_STEPS: StatusStep[] = [
  { key: 'aberto', label: SINISTRO_LABELS.aberto, stage: 'abertura' },
  { key: 'analise_seguradora', label: SINISTRO_LABELS.analise_seguradora, stage: 'analise' },
  { key: 'aguardando_vistoria', label: SINISTRO_LABELS.aguardando_vistoria, stage: 'analise' },
  { key: 'aguardando_documento', label: SINISTRO_LABELS.aguardando_documento, stage: 'analise' },
  { key: 'na_oficina', label: SINISTRO_LABELS.na_oficina, stage: 'execucao' },
  { key: 'aguardando_peca', label: SINISTRO_LABELS.aguardando_peca, stage: 'execucao' },
  { key: 'aguardando_reparo', label: SINISTRO_LABELS.aguardando_reparo, stage: 'execucao' },
  { key: 'carro_reserva', label: SINISTRO_LABELS.carro_reserva, stage: 'execucao' },
  { key: 'processo_liquidacao', label: SINISTRO_LABELS.processo_liquidacao, stage: 'execucao' },
  { key: 'acordo', label: SINISTRO_LABELS.acordo, stage: 'finalizacao' },
  { key: 'lucros_cessantes', label: SINISTRO_LABELS.lucros_cessantes, stage: 'finalizacao' },
  { key: 'dc_danos_corporais', label: SINISTRO_LABELS.dc_danos_corporais, stage: 'finalizacao' },
  { key: 'finalizado_reparado', label: SINISTRO_LABELS.finalizado_reparado, stage: 'encerrado' },
  { key: 'finalizado_sem_indenizacao', label: SINISTRO_LABELS.finalizado_sem_indenizacao, stage: 'encerrado' },
  { key: 'finalizado_com_indenizacao', label: SINISTRO_LABELS.finalizado_com_indenizacao, stage: 'encerrado' },
  { key: 'finalizado_inatividade', label: SINISTRO_LABELS.finalizado_inatividade, stage: 'encerrado' }
];

export const ASSISTENCIA_STEPS: StatusStep[] = [
  { key: 'aberto', label: ASSISTENCIA_LABELS.aberto, stage: 'abertura' },
  { key: 'atendimento_andamento', label: ASSISTENCIA_LABELS.atendimento_andamento, stage: 'execucao' },
  { key: 'saida_de_base', label: ASSISTENCIA_LABELS.saida_de_base, stage: 'execucao' },
  { key: 'aguardando_prestador', label: ASSISTENCIA_LABELS.aguardando_prestador, stage: 'analise' },
  { key: 'aguardando_vistoria', label: ASSISTENCIA_LABELS.aguardando_vistoria, stage: 'analise' },
  { key: 'aguardando_peca', label: ASSISTENCIA_LABELS.aguardando_peca, stage: 'execucao' },
  { key: 'aguardando_documentos', label: ASSISTENCIA_LABELS.aguardando_documentos, stage: 'analise' },
  { key: 'aguardando_reparo', label: ASSISTENCIA_LABELS.aguardando_reparo, stage: 'execucao' },
  { key: 'reembolso', label: ASSISTENCIA_LABELS.reembolso, stage: 'finalizacao' },
  { key: 'vidros', label: ASSISTENCIA_LABELS.vidros, stage: 'execucao' },
  { key: 'aguardando_retorno', label: ASSISTENCIA_LABELS.aguardando_retorno, stage: 'finalizacao' },
  { key: 'finalizado_inatividade', label: ASSISTENCIA_LABELS.finalizado_inatividade, stage: 'encerrado' },
  { key: 'finalizado', label: ASSISTENCIA_LABELS.finalizado, stage: 'encerrado' }
];

// Cores por estágio
export const STAGE_COLORS: Record<StatusStage, string> = {
  abertura: 'hsl(var(--primary))', // azul
  analise: 'hsl(var(--secondary))', // roxo
  execucao: 'hsl(var(--accent))', // amarelo
  finalizacao: 'hsl(var(--success))', // verde
  encerrado: 'hsl(var(--muted-foreground))' // cinza
};