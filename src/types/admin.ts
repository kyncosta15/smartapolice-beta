export interface AdminMetrics {
  apolices_total: number;
  apolices_por_seguradora: { seguradora: string; total: number }[];
  sinistros_total: number;
  assistencias_total: number;
  medias_30: { sinistros: number; assistencias: number };
  medias_60: { sinistros: number; assistencias: number };
  veiculos_por_empresa: {
    empresa_id: string;
    empresa_nome: string;
    total_veiculos: number;
  }[];
}

export interface CompanySummary {
  empresa_id: string;
  empresa_nome: string;
  usuarios: number;
  veiculos: number;
  apolices: number;
  sinistros_abertos: number;
  assistencias_abertas: number;
  ultima_atividade: string;
}

export interface ApprovalRequest {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  veiculo_id: string;
  placa: string;
  current_status: string;
  requested_status: string;
  motivo: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  created_at: string;
  decided_at?: string;
  decision_note?: string;
}
