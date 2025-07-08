
// Interface para o formato direto do N8N
export interface N8NDirectData {
  numero_apolice: string;
  segurado: string;
  seguradora: string;
  tipo: string;
  inicio: string;
  fim: string;
  premio: number;
  parcelas: number;
  pagamento: string;
  custo_mensal: number;
  vencimentos_futuros: string[];
  status: string;
  documento?: string;
  documento_tipo?: 'CPF' | 'CNPJ';
  modelo_veiculo?: string;
  uf?: string;
  franquia?: number;
  cidade?: string;
  placa?: string;
  ano_modelo?: number;
  condutor?: string;
  email?: string;
  telefone?: string;
  corretora?: string;
  coberturas?: Array<{
    descricao: string;
    lmi?: number;
  }>;
}

export interface InstallmentData {
  numero: number;
  valor: number;
  data: string;
  status: 'paga' | 'pendente';
}
