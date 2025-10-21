// Tipos para o sistema de sinistros

export type Vehicle = {
  id: string;
  placa: string;
  chassi?: string;
  renavam?: string;
  marca?: string;
  modelo?: string;
  ano_modelo?: number;
  categoria?: string;
  combustivel?: string;
  codigo_fipe?: string;
  proprietario_nome?: string;
  proprietario_doc?: string;
  proprietario_tipo?: 'pf' | 'pj';
  status_seguro?: string;
  status_veiculo?: string;
  uf_emplacamento?: string;
  localizacao?: string;
};

export type Policy = {
  id: string;
  numero?: string;
  seguradora?: string;
  vigencia_inicio?: string;
  vigencia_fim?: string;
  veiculo_id?: string;
};

export type ClaimStatus = 'aberto' | 'em_regulacao' | 'finalizado';

export type Claim = {
  id: string;
  ticket: string;
  veiculo: Vehicle;
  apolice?: Policy | null;
  status: ClaimStatus;
  valor_estimado?: number;
  created_at: string;
  updated_at: string;
  ultima_movimentacao?: string; // ISO date
};

export type ClaimEventType = 'abertura' | 'analise' | 'documentacao' | 'regulacao' | 'pagamento' | 'encerramento' | 'outro';

export type ClaimEvent = {
  id: string;
  claim_id: string;
  tipo: ClaimEventType;
  descricao?: string;
  responsavel?: string;
  data: string; // ISO
};

export type AssistanceType = 'guincho' | 'vidro' | 'residencia' | 'outro';

export type Assistance = {
  id: string;
  tipo: AssistanceType;
  veiculo: Vehicle;
  status: 'aberto' | 'finalizado';
  created_at: string;
};

export type ClaimsView = 'sinistros' | 'assistencias';

export type CRLVStatus = 'pendente' | 'pago';

export type CRLVItem = {
  id: string;
  veiculo: Vehicle;
  status: CRLVStatus;
  valor?: number;
  vencimento?: string;
};