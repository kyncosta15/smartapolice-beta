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
  segurado?: {
    nome?: string;
    documento?: string;
    tipo_pessoa?: 'PF' | 'PJ';
    cpf_cnpj?: string;
  };
  
  // ✅ Campos de documento do N8N - usando string para compatibilidade total
  documento?: string;
  documento_tipo?: string;
  
  parcelas_detalhadas?: any[];
  vencimentos_futuros?: any[];
}
