export type FleetRequestTipo = 
  | 'inclusao_veiculo'
  | 'exclusao_veiculo' 
  | 'tirar_do_seguro'
  | 'colocar_no_seguro'
  | 'atualizacao_dados'
  | 'mudanca_responsavel'
  | 'documentacao';

export type FleetRequestStatus = 
  | 'aberto'
  | 'em_triagem'
  | 'aprovado'
  | 'executado'
  | 'recusado';

export type FleetRequestPrioridade = 
  | 'baixa'
  | 'normal'
  | 'alta';

export interface FleetChangeRequest {
  id: string;
  empresa_id: string;
  user_id: string;
  vehicle_id?: string;
  tipo: FleetRequestTipo;
  placa?: string;
  chassi?: string;
  renavam?: string;
  status: FleetRequestStatus;
  prioridade: FleetRequestPrioridade;
  payload: Record<string, any>;
  anexos: FleetRequestAttachment[];
  created_at: string;
  updated_at: string;
}

export interface FleetRequestAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface FleetRequestFormData {
  tipo: FleetRequestTipo;
  placa?: string;
  chassi?: string;
  renavam?: string;
  motivo: string;
  seguro?: {
    seguradora?: string;
    numero_apolice?: string;
    vigencia_inicio?: string;
    vigencia_fim?: string;
    cobertura?: string;
  };
  responsavel?: {
    nome?: string;
    telefone?: string;
    email?: string;
  };
  anexos: File[];
}

export interface PublicFleetToken {
  id: string;
  token: string;
  empresa_id: string;
  expires_at: string;
  used_at?: string;
  created_by: string;
  created_at: string;
}

export const FLEET_REQUEST_TIPOS: { value: FleetRequestTipo; label: string }[] = [
  { value: 'inclusao_veiculo', label: 'Inclusão de veículo' },
  { value: 'exclusao_veiculo', label: 'Exclusão de veículo' },
  { value: 'tirar_do_seguro', label: 'Tirar do seguro' },
  { value: 'colocar_no_seguro', label: 'Colocar no seguro' },
  { value: 'atualizacao_dados', label: 'Atualização de dados' },
  { value: 'mudanca_responsavel', label: 'Mudança de responsável' },
  { value: 'documentacao', label: 'Documentação' },
];

export const FLEET_REQUEST_STATUS: { value: FleetRequestStatus; label: string; color: string }[] = [
  { value: 'aberto', label: 'Aberto', color: 'blue' },
  { value: 'em_triagem', label: 'Em triagem', color: 'yellow' },
  { value: 'aprovado', label: 'Aprovado', color: 'green' },
  { value: 'executado', label: 'Executado', color: 'gray' },
  { value: 'recusado', label: 'Recusado', color: 'red' },
];

export const FLEET_REQUEST_PRIORIDADES: { value: FleetRequestPrioridade; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'alta', label: 'Alta', color: 'red' },
];