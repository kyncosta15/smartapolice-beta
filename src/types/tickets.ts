// Types para o sistema de Sinistros & Assistências

export type TicketTipo = 'sinistro' | 'assistencia';

export type TicketStatus = 'aberto' | 'em_analise' | 'finalizado' | 'cancelado';

export type TicketSubtipo = 
  // Subtipos de Sinistro
  | 'colisao' | 'roubo' | 'furto' | 'avaria' | 'incendio' | 'danos_terceiros'
  // Subtipos de Assistência
  | 'guincho' | 'vidro' | 'mecanica' | 'chaveiro' | 'pneu' | 'combustivel' | 'residencia';

export type MovementTipo = 'status_change' | 'comentario' | 'anexo' | 'criacao';

export type AttachmentTipo = 'apolice' | 'documento' | 'foto' | 'bo' | 'crlv' | 'outros';

export type DeleteRequestStatus = 'solicitado' | 'aprovado' | 'negado';

export interface Ticket {
  id: string;
  tipo: TicketTipo;
  subtipo?: TicketSubtipo;
  vehicle_id?: string;
  segurado_id?: string; // ID do segurado/colaborador quando não vinculado a veículo
  apolice_id?: string;
  status: TicketStatus;
  data_evento?: string;
  valor_estimado?: number;
  descricao?: string;
  localizacao?: string;
  gravidade?: 'baixa' | 'media' | 'alta' | 'critica';
  origem: 'portal' | 'importacao' | 'api';
  created_by?: string;
  empresa_id?: string;
  protocol_code?: string;
  payload?: any;
  external_ref?: string;
  sla_due_at?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  vehicle?: {
    id: string;
    placa: string;
    marca?: string;
    modelo?: string;
    status_seguro?: string;
  };
  segurado?: {
    id: string;
    nome: string;
    cpf: string;
    cargo?: string;
  };
  movements?: TicketMovement[];
  attachments?: TicketAttachment[];
}

export interface TicketMovement {
  id: string;
  ticket_id: string;
  tipo: MovementTipo;
  descricao?: string;
  payload?: any;
  created_by?: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id?: string;
  vehicle_id?: string;
  tipo: AttachmentTipo;
  nome_arquivo: string;
  file_url?: string;
  file_path: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  created_at: string;
}

export interface DeleteRequest {
  id: string;
  contexto: 'vehicle' | 'ticket';
  context_id: string;
  motivo: string;
  status: DeleteRequestStatus;
  requested_by: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface TicketStats {
  totalSinistros: number;
  sinistrosAbertos: number;
  sinistrosFinalizados: number;
  totalAssistencias: number;
  assistenciasAbertas: number;
  assistenciasFinalizadas: number;
  totalUltimos60Dias: number;
}

export interface TicketFilters {
  tipo?: TicketTipo;
  status?: TicketStatus;
  subtipo?: TicketSubtipo;
  periodo?: 'ultimos_30' | 'ultimos_60' | 'ultimos_90' | 'custom';
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  comSeguro?: boolean;
  semSeguro?: boolean;
  categoria?: string;
  seguradora?: string;
}

export interface ChartData {
  subtipos: { name: string; value: number; tipo: TicketTipo }[];
  porMes: { mes: string; sinistros: number; assistencias: number }[];
  porCategoria: { categoria: string; quantidade: number }[];
}