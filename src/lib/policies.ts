import { safeString } from '@/utils/safeDataRenderer';
import { PolicyTypeNormalizer } from '@/utils/parsers/policyTypeNormalizer';

// lib/policies.ts - CORREÇÃO CONSERVADORA
type SeguradoraObj = { empresa?: string; entidade?: string | null };
type TipoObj = { categoria?: string; cobertura?: string };

function parseMaybeJson<T = any>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  if (typeof v === "object") return v as T;
  return null;
}

function toNumberSafe(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.toString().replace(/[^\d.,-]/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizePolicy(raw: any) {
  const segParsed = parseMaybeJson<SeguradoraObj>(raw.seguradora || raw.insurer);
  const tipoParsed = parseMaybeJson<TipoObj>(raw.tipo || raw.type);

  // CONVERSÃO SEGURA - SEMPRE STRINGS
  const seguradoraEmpresa = safeString(
    segParsed?.empresa ?? raw.seguradora ?? raw.insurer ?? "N/A"
  );

  const seguradoraEntidade = safeString(
    segParsed?.entidade ?? null
  );

  const tipoCategoria = safeString(
    tipoParsed?.categoria ?? raw.tipo ?? raw.type ?? "N/A"
  );

  const tipoCobertura = safeString(
    tipoParsed?.cobertura ?? "N/A"
  );

  // CRÍTICO: Priorizar SEMPRE campos do banco de dados
  // Se vier do banco, usar direto. Se vier de extração, usar fallback.
  const valorMensal = toNumberSafe(
    raw.custo_mensal ?? raw.valor_parcela ?? raw.valor_mensal_num ?? raw.valorMensal ?? raw.monthlyAmount
  ) ?? 0;
  
  const premio = toNumberSafe(
    raw.valor_premio ?? raw.premio ?? raw.premium
  ) ?? 0;
  
  console.log(`💰 [normalizePolicy] ${raw.segurado || raw.name}:`, {
    fonte: raw.custo_mensal ? 'BANCO (custo_mensal)' : raw.valor_parcela ? 'BANCO (valor_parcela)' : 'OUTRO',
    custo_mensal_raw: raw.custo_mensal,
    valor_parcela_raw: raw.valor_parcela, 
    valor_mensal_num_raw: raw.valor_mensal_num,
    valorMensal_calculado: valorMensal,
    premio_calculado: premio
  });
  
  // CRÍTICO: Priorizar tipo_seguro do banco e forçar normalização para garantias
  const tipoSeguroRaw = safeString(
    raw.tipo_seguro ?? raw.tipo ?? raw.type ?? "N/A"
  );

  const tipoSeguro = PolicyTypeNormalizer.normalizeType(tipoSeguroRaw) === 'garantia_obrigacoes'
    ? 'garantia_obrigacoes'
    : tipoSeguroRaw;

  return {
    ...raw,
    seguradoraEmpresa,
    seguradoraEntidade,
    tipoCategoria: tipoSeguro, // Usar tipo_seguro consistentemente
    tipoCobertura,
    // CRÍTICO: Garantir que todos os campos financeiros sejam incluídos
    valorMensal,
    premio,
    premium: premio, // Mapear para campo do frontend
    monthlyAmount: valorMensal, // Mapear para campo do frontend
    valor_premio: premio, // Garantir campo do banco
    custo_mensal: valorMensal, // Garantir campo do banco
    valor_parcela: valorMensal, // Campo alternativo do banco
    // Campos principais - SEMPRE STRINGS
    seguradora: seguradoraEmpresa,
    insurer: seguradoraEmpresa,
    tipo: tipoSeguro, // Usar tipo_seguro
    tipo_seguro: tipoSeguro, // Garantir campo do banco
    type: tipoSeguro, // Mapear para campo do frontend
    name: safeString(raw.name ?? raw.segurado ?? "N/A"),
    policyNumber: safeString(raw.policyNumber ?? raw.numero_apolice ?? "N/A"),
    documento: safeString(raw.documento ?? ""),
    documento_tipo: raw.documento_tipo,
    // CRÍTICO: Manter campo renovada do banco
    renovada: raw.renovada,
    // Campos CorpNuvem/InfoCap
    nosnum: raw.nosnum,
    codfil: raw.codfil,
    // Campos de veículo/embarcação - CRÍTICO: preservar do banco
    vehicleModel: safeString(raw.vehicleModel ?? raw.modelo_veiculo ?? ""),
    modelo_veiculo: safeString(raw.modelo_veiculo ?? raw.vehicleModel ?? ""),
    marca: safeString(raw.marca ?? ""),
    placa: safeString(raw.placa ?? ""),
    nome_embarcacao: safeString(raw.nome_embarcacao ?? ""),
    ano_modelo: safeString(raw.ano_modelo ?? ""),
    deductible: toNumberSafe(raw.deductible ?? raw.franquia) ?? 0,
    franquia: toNumberSafe(raw.franquia ?? raw.deductible) ?? 0,
    // Campo específico para saúde - preservar valor original (null ou string)
    nome_plano_saude: raw.nome_plano_saude || null,
  };
}

// Helper de formatação de moeda
export const moedaBR = (v?: number | null) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "N/A";

// Helper adicional para renderização segura de texto - VERSÃO REFATORADA
export const toText = (v: any): string => {
  return safeString(v);
};

// "Airbag" imediato para valores problemáticos - VERSÃO REFATORADA  
export const toDisplay = (v: any) => {
  return safeString(v);
};