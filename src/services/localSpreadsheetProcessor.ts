import * as XLSX from 'xlsx';

export interface ProcessedVehicle {
  placa: string;
  marca?: string;
  modelo?: string;
  chassi?: string;
  renavam?: string;
  ano_modelo?: number;
  categoria?: string;
  combustivel?: string;
  codigo_fipe?: string;
  uf_emplacamento?: string;
  localizacao?: string;
  proprietario_nome?: string;
  proprietario_doc?: string;
  proprietario_tipo?: string;
  status_veiculo?: string;
  status_seguro?: string;
  codigo_interno?: string;
  funcao?: string;
  familia?: string;
  modalidade_compra?: string;
  preco_nf?: number;
  preco_fipe?: number;
  data_venc_emplacamento?: string;
  observacoes?: string;
}

export interface LocalProcessResult {
  success: boolean;
  veiculos: ProcessedVehicle[];
  totalProcessados: number;
  erros: string[];
  metrics?: {
    totalVeiculos: number;
    veiculosValidos: number;
    veiculosInvalidos: number;
  };
}

// Mapeamento de cabeçalhos da planilha para campos do banco
const COLUMN_MAPPING: Record<string, keyof ProcessedVehicle> = {
  // Cabeçalhos do modelo padrão
  'Placa *': 'placa',
  'Placa': 'placa',
  'PLACA': 'placa',
  'placa': 'placa',
  'Marca': 'marca',
  'MARCA': 'marca',
  'marca': 'marca',
  'Modelo': 'modelo',
  'MODELO': 'modelo',
  'modelo': 'modelo',
  'Chassi': 'chassi',
  'CHASSI': 'chassi',
  'chassi': 'chassi',
  'Renavam': 'renavam',
  'RENAVAM': 'renavam',
  'renavam': 'renavam',
  'Ano Modelo': 'ano_modelo',
  'ANO MODELO': 'ano_modelo',
  'ano_modelo': 'ano_modelo',
  'Ano': 'ano_modelo',
  'ANO': 'ano_modelo',
  'Categoria': 'categoria',
  'CATEGORIA': 'categoria',
  'categoria': 'categoria',
  'Tipo': 'categoria',
  'TIPO': 'categoria',
  'Combustível': 'combustivel',
  'COMBUSTÍVEL': 'combustivel',
  'COMBUSTIVEL': 'combustivel',
  'combustivel': 'combustivel',
  'Código FIPE': 'codigo_fipe',
  'CÓDIGO FIPE': 'codigo_fipe',
  'CODIGO FIPE': 'codigo_fipe',
  'codigo_fipe': 'codigo_fipe',
  'Cod FIPE': 'codigo_fipe',
  'COD FIPE': 'codigo_fipe',
  'UF Emplacamento': 'uf_emplacamento',
  'UF EMPLACAMENTO': 'uf_emplacamento',
  'uf_emplacamento': 'uf_emplacamento',
  'UF': 'uf_emplacamento',
  'Localização': 'localizacao',
  'LOCALIZAÇÃO': 'localizacao',
  'LOCALIZACAO': 'localizacao',
  'localizacao': 'localizacao',
  'Local': 'localizacao',
  'LOCAL': 'localizacao',
  'Cidade': 'localizacao',
  'CIDADE': 'localizacao',
  'Proprietário Nome': 'proprietario_nome',
  'PROPRIETÁRIO NOME': 'proprietario_nome',
  'PROPRIETARIO NOME': 'proprietario_nome',
  'proprietario_nome': 'proprietario_nome',
  'Proprietário': 'proprietario_nome',
  'PROPRIETÁRIO': 'proprietario_nome',
  'PROPRIETARIO': 'proprietario_nome',
  'Proprietário Documento': 'proprietario_doc',
  'PROPRIETÁRIO DOCUMENTO': 'proprietario_doc',
  'proprietario_doc': 'proprietario_doc',
  'CPF/CNPJ Proprietário': 'proprietario_doc',
  'Proprietário Tipo': 'proprietario_tipo',
  'PROPRIETÁRIO TIPO': 'proprietario_tipo',
  'proprietario_tipo': 'proprietario_tipo',
  'Status Veículo': 'status_veiculo',
  'STATUS VEÍCULO': 'status_veiculo',
  'STATUS VEICULO': 'status_veiculo',
  'status_veiculo': 'status_veiculo',
  'Status': 'status_veiculo',
  'STATUS': 'status_veiculo',
  'Status Seguro': 'status_seguro',
  'STATUS SEGURO': 'status_seguro',
  'status_seguro': 'status_seguro',
  'Código Interno': 'codigo_interno',
  'CÓDIGO INTERNO': 'codigo_interno',
  'CODIGO INTERNO': 'codigo_interno',
  'codigo_interno': 'codigo_interno',
  'Código': 'codigo_interno',
  'CÓDIGO': 'codigo_interno',
  'CODIGO': 'codigo_interno',
  'Função': 'funcao',
  'FUNÇÃO': 'funcao',
  'FUNCAO': 'funcao',
  'funcao': 'funcao',
  'Família': 'familia',
  'FAMÍLIA': 'familia',
  'FAMILIA': 'familia',
  'familia': 'familia',
  'Modalidade Compra': 'modalidade_compra',
  'MODALIDADE COMPRA': 'modalidade_compra',
  'modalidade_compra': 'modalidade_compra',
  'Preço NF': 'preco_nf',
  'PREÇO NF': 'preco_nf',
  'PRECO NF': 'preco_nf',
  'preco_nf': 'preco_nf',
  'Valor NF': 'preco_nf',
  'VALOR NF': 'preco_nf',
  'Preço FIPE': 'preco_fipe',
  'PREÇO FIPE': 'preco_fipe',
  'PRECO FIPE': 'preco_fipe',
  'preco_fipe': 'preco_fipe',
  'Valor FIPE': 'preco_fipe',
  'VALOR FIPE': 'preco_fipe',
  'Data Vencimento Emplacamento': 'data_venc_emplacamento',
  'DATA VENCIMENTO EMPLACAMENTO': 'data_venc_emplacamento',
  'data_venc_emplacamento': 'data_venc_emplacamento',
  'Venc. Emplacamento': 'data_venc_emplacamento',
  'Observações': 'observacoes',
  'OBSERVAÇÕES': 'observacoes',
  'OBSERVACOES': 'observacoes',
  'observacoes': 'observacoes',
  'Obs': 'observacoes',
  'OBS': 'observacoes',
};

// Normaliza a categoria para os valores aceitos pelo banco
function normalizeCategoria(categoria: string | undefined): string {
  if (!categoria) return 'Carros';
  
  const cat = categoria.toLowerCase().trim();
  
  if (cat.includes('moto') || cat.includes('motocicleta') || cat.includes('bicicleta motor')) {
    return 'Moto';
  }
  
  if (cat.includes('caminhão') || cat.includes('caminhao') || cat.includes('rebocador') ||
      cat.includes('reboque') || cat.includes('semi-reboque') || cat.includes('truck') ||
      cat.includes('trator') || cat.includes('onibus') || cat.includes('ônibus')) {
    return 'Caminhão';
  }
  
  return 'Carros';
}

// Limpa e valida placa
function cleanPlaca(placa: string | undefined): string | null {
  if (!placa) return null;
  
  // Remove espaços, traços e converte para maiúsculo
  const cleaned = String(placa).replace(/[\s\-\.]/g, '').toUpperCase().trim();
  
  // Valida formato (Mercosul ou antigo)
  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const antigoRegex = /^[A-Z]{3}[0-9]{4}$/;
  
  if (mercosulRegex.test(cleaned) || antigoRegex.test(cleaned)) {
    return cleaned;
  }
  
  // Se não for válido mas tem caracteres, retorna como está (será validado depois)
  if (cleaned.length >= 7) {
    return cleaned;
  }
  
  return null;
}

// Converte valor para número
function toNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  
  if (typeof value === 'number') return value;
  
  // Remove R$, pontos de milhar, e converte vírgula para ponto
  const cleaned = String(value)
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

// Converte valor para ano
function toYear(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  
  const num = parseInt(String(value));
  
  // Valida se é um ano razoável (entre 1900 e 2100)
  if (!isNaN(num) && num >= 1900 && num <= 2100) {
    return num;
  }
  
  return undefined;
}

export class LocalSpreadsheetProcessor {
  /**
   * Processa um arquivo Excel localmente
   */
  static async processFile(file: File): Promise<LocalProcessResult> {
    const erros: string[] = [];
    const veiculos: ProcessedVehicle[] = [];
    
    try {
      console.log('📊 [LocalProcessor] Iniciando processamento local de:', file.name);
      
      // Lê o arquivo
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Pega a primeira aba (ou a aba "Modelo" se existir)
      let sheetName = workbook.SheetNames[0];
      if (workbook.SheetNames.includes('Modelo')) {
        sheetName = 'Modelo';
      } else if (workbook.SheetNames.includes('Dados')) {
        sheetName = 'Dados';
      } else if (workbook.SheetNames.includes('Veiculos')) {
        sheetName = 'Veiculos';
      } else if (workbook.SheetNames.includes('Veículos')) {
        sheetName = 'Veículos';
      }
      
      console.log('📋 [LocalProcessor] Usando aba:', sheetName);
      
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (rawData.length < 2) {
        throw new Error('Planilha vazia ou sem dados além do cabeçalho');
      }
      
      // Primeira linha é o cabeçalho
      const headers = rawData[0] as string[];
      console.log('📋 [LocalProcessor] Cabeçalhos encontrados:', headers);
      
      // Mapeia os índices das colunas
      const columnIndex: Record<keyof ProcessedVehicle, number> = {} as any;
      headers.forEach((header, index) => {
        const headerStr = String(header || '').trim();
        const mappedField = COLUMN_MAPPING[headerStr];
        if (mappedField) {
          columnIndex[mappedField] = index;
          console.log(`  ✅ Coluna ${index} "${headerStr}" → ${mappedField}`);
        }
      });
      
      // Verifica se tem a coluna de placa (obrigatória)
      if (columnIndex.placa === undefined) {
        throw new Error('Coluna "Placa" não encontrada na planilha');
      }
      
      // Processa cada linha de dados
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Pula linhas vazias
        if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
          continue;
        }
        
        try {
          const placa = cleanPlaca(row[columnIndex.placa]);
          
          if (!placa) {
            erros.push(`Linha ${i + 1}: Placa inválida ou vazia`);
            continue;
          }
          
          const veiculo: ProcessedVehicle = {
            placa,
            marca: columnIndex.marca !== undefined ? String(row[columnIndex.marca] || '').trim() || undefined : undefined,
            modelo: columnIndex.modelo !== undefined ? String(row[columnIndex.modelo] || '').trim() || undefined : undefined,
            chassi: columnIndex.chassi !== undefined ? String(row[columnIndex.chassi] || '').trim() || undefined : undefined,
            renavam: columnIndex.renavam !== undefined ? String(row[columnIndex.renavam] || '').trim() || undefined : undefined,
            ano_modelo: toYear(row[columnIndex.ano_modelo]),
            categoria: normalizeCategoria(row[columnIndex.categoria]),
            combustivel: columnIndex.combustivel !== undefined ? String(row[columnIndex.combustivel] || '').trim() || undefined : undefined,
            codigo_fipe: columnIndex.codigo_fipe !== undefined ? String(row[columnIndex.codigo_fipe] || '').trim() || undefined : undefined,
            uf_emplacamento: columnIndex.uf_emplacamento !== undefined ? String(row[columnIndex.uf_emplacamento] || '').toUpperCase().trim() || undefined : undefined,
            localizacao: columnIndex.localizacao !== undefined ? String(row[columnIndex.localizacao] || '').trim() || undefined : undefined,
            proprietario_nome: columnIndex.proprietario_nome !== undefined ? String(row[columnIndex.proprietario_nome] || '').trim() || undefined : undefined,
            proprietario_doc: columnIndex.proprietario_doc !== undefined ? String(row[columnIndex.proprietario_doc] || '').trim() || undefined : undefined,
            proprietario_tipo: columnIndex.proprietario_tipo !== undefined ? String(row[columnIndex.proprietario_tipo] || '').toLowerCase().trim() || undefined : undefined,
            status_veiculo: columnIndex.status_veiculo !== undefined ? String(row[columnIndex.status_veiculo] || '').toLowerCase().trim() || 'ativo' : 'ativo',
            status_seguro: columnIndex.status_seguro !== undefined ? String(row[columnIndex.status_seguro] || '').toLowerCase().trim() || 'sem_seguro' : 'sem_seguro',
            codigo_interno: columnIndex.codigo_interno !== undefined ? String(row[columnIndex.codigo_interno] || '').trim() || undefined : undefined,
            funcao: columnIndex.funcao !== undefined ? String(row[columnIndex.funcao] || '').trim() || undefined : undefined,
            familia: columnIndex.familia !== undefined ? String(row[columnIndex.familia] || '').trim() || undefined : undefined,
            modalidade_compra: columnIndex.modalidade_compra !== undefined ? String(row[columnIndex.modalidade_compra] || '').trim() || undefined : undefined,
            preco_nf: toNumber(row[columnIndex.preco_nf]),
            preco_fipe: toNumber(row[columnIndex.preco_fipe]),
            data_venc_emplacamento: columnIndex.data_venc_emplacamento !== undefined ? String(row[columnIndex.data_venc_emplacamento] || '').trim() || undefined : undefined,
            observacoes: columnIndex.observacoes !== undefined ? String(row[columnIndex.observacoes] || '').trim() || undefined : undefined,
          };
          
          veiculos.push(veiculo);
          console.log(`  ✅ Linha ${i + 1}: ${placa} processada`);
          
        } catch (rowError) {
          erros.push(`Linha ${i + 1}: ${rowError instanceof Error ? rowError.message : 'Erro desconhecido'}`);
        }
      }
      
      console.log(`📊 [LocalProcessor] Processamento concluído: ${veiculos.length} veículos, ${erros.length} erros`);
      
      return {
        success: veiculos.length > 0,
        veiculos,
        totalProcessados: veiculos.length,
        erros,
        metrics: {
          totalVeiculos: rawData.length - 1,
          veiculosValidos: veiculos.length,
          veiculosInvalidos: erros.length,
        },
      };
      
    } catch (error) {
      console.error('❌ [LocalProcessor] Erro fatal:', error);
      return {
        success: false,
        veiculos: [],
        totalProcessados: 0,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido ao processar planilha'],
        metrics: {
          totalVeiculos: 0,
          veiculosValidos: 0,
          veiculosInvalidos: 1,
        },
      };
    }
  }
  
  /**
   * Converte o resultado do processamento local para o formato esperado pela edge function
   */
  static toEdgeFunctionFormat(result: LocalProcessResult, empresaId: string): any {
    return {
      veiculos: result.veiculos.map(v => ({
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        chassi: v.chassi,
        renavam: v.renavam,
        ano: v.ano_modelo,
        familia: v.familia || v.categoria,
        localizacao: v.localizacao,
        proprietario: v.proprietario_nome,
        status: v.status_veiculo,
        codigo: v.codigo_interno,
        origem_planilha: 'LOCAL_PROCESSOR',
      })),
      empresaId,
    };
  }
}
