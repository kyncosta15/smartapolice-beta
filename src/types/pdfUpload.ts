
export interface FileProcessingStatus {
  [fileName: string]: {
    progress: number;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    message: string;
  };
}

export interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: any) => void;
}

export interface DynamicPDFData {
  informacoes_gerais: {
    nome_apolice: string;
    tipo: string;
    status: string;
    numero_apolice: string;
  };
  seguradora: {
    empresa: string;
    categoria: string;
    cobertura: string;
    entidade: string;
  };
  informacoes_financeiras: {
    premio_anual: number;
    premio_mensal: number;
  };
  vigencia: {
    inicio: string;
    fim: string;
    extraido_em: string;
  };
  // Added vencimentos_futuros property
  vencimentos_futuros?: string[];
  // Campos expandidos opcionais
  segurado?: {
    nome?: string;
    cpf?: string;
    data_nascimento?: string;
    email?: string;
    telefone?: string;
    // Novos campos de documento
    documento?: string;
    tipo_pessoa?: 'PF' | 'PJ';
    cpf_cnpj?: string;
  };
  veiculo?: {
    marca?: string;
    modelo?: string;
    ano_modelo?: string;
    placa?: string;
    chassi?: string;
    uso?: string;
  };
  coberturas?: {
    tipo?: string;
    franquia?: number;
    danos_materiais?: number;
    danos_corporais?: number;
  };
  // Adicionando parcelas detalhadas
  parcelas_detalhadas?: Array<{
    numero: number;
    valor: number;
    data: string;
    status: 'paga' | 'pendente';
  }>;
}

// Interface legada mantida para compatibilidade
export interface ExtractedPDFData {
  seguradora?: string;
  numero_apolice?: string;
  item?: string;
  tipo_apolice?: string;
  ramo?: string;
  data_emissao?: string;
  inicio_vigencia?: string;
  fim_vigencia?: string;
  
  segurado?: {
    nome?: string;
    cpf?: string;
    data_nascimento?: string;
    email?: string;
    telefone?: string;
  };

  condutor?: {
    nome?: string;
    cpf?: string;
    data_nascimento?: string;
    condutor_principal?: boolean;
  };

  proprietario?: {
    nome?: string;
    cpf?: string;
  };

  veiculo?: {
    marca?: string;
    modelo?: string;
    ano_fabricacao?: string;
    ano_modelo?: string;
    placa?: string;
    chassi?: string;
    codigo_fipe?: string;
    uso?: string;
    tipo?: string;
    combustivel?: string;
    portas?: number | null;
    eixos?: number | null;
    lotacao?: number | null;
    antifurto?: string;
  };

  coberturas?: {
    tipo?: string;
    valor_mercado?: string;
    danos_materiais_terceiros?: number;
    danos_corporais_terceiros?: number;
    danos_morais?: number;
    franquia?: number;
  };

  pagamento?: {
    premio_total?: number;
    premio_veiculo?: number;
    premio_rcf?: number;
    parcelas?: number;
    valor_parcela?: number;
    forma_pagamento?: string;
    bandeira_cartao?: string;
    fim_validade_cartao?: string;
    pagamento_confirmado?: boolean;
    custo_mensal?: number;
  };

  outros?: {
    cosseguro?: boolean;
    corretora?: string;
    susep?: string;
    observacoes?: string;
  };
}
