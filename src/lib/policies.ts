import { safeString } from '@/utils/safeDataRenderer';

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

  // CRÍTICO: Priorizar campos do banco de dados (valor_premio, custo_mensal)
  const valorMensal = toNumberSafe(
    raw.custo_mensal ?? raw.valor_parcela ?? raw.valorMensal ?? raw.monthlyAmount
  ) ?? 0;
  
  const premio = toNumberSafe(
    raw.valor_premio ?? raw.premio ?? raw.premium
  ) ?? 0;

  return {
    ...raw,
    seguradoraEmpresa,
    seguradoraEntidade,
    tipoCategoria,
    tipoCobertura,
    valorMensal,
    premio,
    // Campos principais - SEMPRE STRINGS
    seguradora: seguradoraEmpresa,
    insurer: seguradoraEmpresa,
    tipo: tipoCategoria,
    type: tipoCategoria,
    name: safeString(raw.name ?? raw.segurado ?? "N/A"),
    policyNumber: safeString(raw.policyNumber ?? raw.numero_apolice ?? "N/A"),
    documento: safeString(raw.documento ?? ""),
    documento_tipo: raw.documento_tipo
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