
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

export interface ExtractedPDFData {
  seguradora?: string;
  numero_apolice?: string;
  item?: string;
  data_emissao?: string;
  inicio?: string;
  fim?: string;
  tipo?: string;
  ramo?: string;
  cobertura?: string;
  cosseguro?: boolean;
  nome_segurado?: string;
  cpf_segurado?: string;
  data_nascimento_segurado?: string;
  email?: string;
  telefone?: string;
  condutor_nome?: string;
  condutor_cpf?: string;
  condutor_nascimento?: string;
  condutor_principal?: boolean;
  proprietario_nome?: string;
  proprietario_cpf?: string;
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
    portas?: number;
    eixos?: number;
    lotacao?: number;
    antifurto?: string;
  };
  valor_mercado?: string;
  premio_veiculo?: number;
  premio_rcf?: number;
  premio_total?: number;
  parcelas?: number;
  valor_parcela?: number;
  forma_pagamento?: string;
  bandeira_cartao?: string;
  fim_validade_cartao?: string;
  pagamento_confirmado?: boolean;
  danos_materiais_terceiros?: number;
  danos_corporais_terceiros?: number;
  danos_morais?: number;
  franquia?: number;
  corretora?: string;
  susep?: string;
}
