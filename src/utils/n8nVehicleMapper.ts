// Utilitário para mapear dados do N8N para o schema do banco de dados

interface VeiculoDB {
  id?: string;
  empresa_id?: string;
  placa: string;
  renavam: string | null;
  marca: string | null;
  modelo: string | null;
  ano_modelo: number | null;
  categoria: 'outros' | 'carro' | 'moto' | 'caminhao' | string;
  proprietario_tipo: 'pj' | 'pf' | null;
  proprietario_doc: string | null;
  proprietario_nome: string | null;
  uf_emplacamento: string | null;
  data_venc_emplacamento: string | null; // ISO
  status_seguro: 'segurado' | 'nao_segurado' | string | null;
  preco_fipe: number | null;
  preco_nf: number | null;
  percentual_tabela: number | null;
  modalidade_compra: 'financiado' | 'avista' | 'consorcio' | null;
  consorcio_grupo: string | null;
  consorcio_cota: string | null;
  consorcio_taxa_adm: number | null;
  data_venc_ultima_parcela: string | null; // ISO
  observacoes: string | null;
}

interface N8NVehiclePayload {
  codigo?: string;
  placa?: string;
  modelo?: string;
  chassi?: string;
  renavam?: string;
  marca?: string;
  ano?: number;
  proprietario?: string;
  localizacao?: string;
  familia?: string;
  status?: string;
  origem_planilha?: string;
}

/**
 * Mapeia dados do payload N8N para o schema do banco de dados
 * @param n8nData - Dados recebidos do N8N
 * @returns Objeto parcial compatível com o schema VeiculoDB
 */
export function mapN8NToVeiculoDB(n8nData: N8NVehiclePayload): Partial<VeiculoDB> {
  // Normalizar categoria baseada na família
  const categoria = normalizarCategoria(n8nData.familia);

  // Normalizar marca
  const marca = normalizarMarca(n8nData.marca);

  // Proprietário vem como string → guardar no nome e assumir 'pj' por padrão
  const proprietario_nome = n8nData.proprietario?.trim() || null;
  const proprietario_tipo: 'pj' | 'pf' | null = proprietario_nome ? 'pj' : null;

  return {
    placa: n8nData.placa?.trim() || '',
    renavam: n8nData.renavam?.trim() || null,
    marca: marca || null,
    modelo: n8nData.modelo?.trim() || null,
    ano_modelo: Number.isFinite(n8nData.ano) ? Number(n8nData.ano) : null,
    categoria,
    proprietario_nome,
    proprietario_tipo,
    // Campos que o N8N não fornece ficam null (serão preenchidos no app)
    uf_emplacamento: null,
    data_venc_emplacamento: null,
    status_seguro: null,
    preco_fipe: null,
    preco_nf: null,
    percentual_tabela: null,
    modalidade_compra: null,
    consorcio_grupo: null,
    consorcio_cota: null,
    consorcio_taxa_adm: null,
    data_venc_ultima_parcela: null,
    observacoes: n8nData.origem_planilha ? `Importado do N8N - ${n8nData.origem_planilha}` : null,
  };
}

/**
 * Normaliza a categoria baseada na família do N8N
 */
function normalizarCategoria(familia?: string): string {
  if (!familia) return 'outros';
  
  const familiaLower = familia.toLowerCase().trim();
  
  // Mapeamento de famílias para categorias
  if (familiaLower.includes('caminhao') || familiaLower.includes('caminhão')) {
    return 'caminhao';
  }
  if (familiaLower.includes('moto') || familiaLower.includes('motocicleta')) {
    return 'moto';
  }
  if (familiaLower.includes('carro') || familiaLower.includes('passeio')) {
    return 'carro';
  }
  
  return 'outros';
}

/**
 * Normaliza nomes de marcas conhecidas
 */
function normalizarMarca(marca?: string): string | null {
  if (!marca) return null;
  
  const marcaUpper = marca.trim().toUpperCase();
  
  // Mapeamento de marcas conhecidas
  const mapeamentoMarcas: Record<string, string> = {
    'M.BENZ': 'MERCEDES BENZ',
    'MBENZ': 'MERCEDES BENZ', 
    'MERCEDES': 'MERCEDES BENZ',
    'VW': 'VOLKSWAGEN',
    'GM': 'CHEVROLET',
    'GENERAL MOTORS': 'CHEVROLET',
  };
  
  return mapeamentoMarcas[marcaUpper] || marca.trim();
}

/**
 * Valida se um payload N8N tem os campos mínimos obrigatórios
 */
export function validarPayloadN8N(payload: N8NVehiclePayload): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  if (!payload.placa?.trim()) {
    erros.push('Placa é obrigatória');
  }
  
  if (!payload.modelo?.trim()) {
    erros.push('Modelo é obrigatório');
  }
  
  if (!payload.marca?.trim()) {
    erros.push('Marca é obrigatória');
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
}

/**
 * Processa um lote de veículos do N8N
 */
export function processarLoteN8N(vehicles: N8NVehiclePayload[]): {
  validos: Partial<VeiculoDB>[];
  invalidos: Array<{ payload: N8NVehiclePayload; erros: string[] }>;
} {
  const validos: Partial<VeiculoDB>[] = [];
  const invalidos: Array<{ payload: N8NVehiclePayload; erros: string[] }> = [];
  
  vehicles.forEach(vehicle => {
    const validacao = validarPayloadN8N(vehicle);
    
    if (validacao.valido) {
      validos.push(mapN8NToVeiculoDB(vehicle));
    } else {
      invalidos.push({
        payload: vehicle,
        erros: validacao.erros
      });
    }
  });
  
  return { validos, invalidos };
}