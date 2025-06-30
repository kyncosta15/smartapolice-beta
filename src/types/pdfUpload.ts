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

  // ✅ Campos aceitos diretamente do N8N
  documento?: string; // pode vir com ou sem pontuação
  documento_tipo?: string; // agora aceita qualquer string: "CPF", "CNPJ", "Desconhecido", etc.

  // ✅ Melhor tipagem nas parcelas
  parcelas_detalhadas?: {
    numero: number;
    valor: number;
    data: string;
    status: 'paga' | 'pendente';
  }[];

  vencimentos_futuros?: string[]; // caso você queira validar a data diretamente
}