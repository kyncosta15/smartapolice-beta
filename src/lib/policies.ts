// lib/policies.ts
type SeguradoraObj = { empresa?: string; entidade?: string | null };
type TipoObj = { categoria?: string; cobertura?: string };

function parseMaybeJson<T = any>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { /* não era JSON */ return null; }
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

  const seguradoraEmpresa =
    segParsed?.empresa ??
    ((typeof (raw.seguradora || raw.insurer) === "string" ? (raw.seguradora || raw.insurer) : "") ||
    "N/A");

  const seguradoraEntidade =
    segParsed?.entidade ??
    (typeof (raw.seguradora || raw.insurer) === "object" ? (raw.seguradora || raw.insurer)?.entidade : null);

  const tipoCategoria =
    tipoParsed?.categoria ??
    ((typeof (raw.tipo || raw.type) === "string" ? (raw.tipo || raw.type) : "") ||
    "N/A");

  const tipoCobertura =
    tipoParsed?.cobertura ??
    ((typeof (raw.tipo || raw.type) === "object" ? (raw.tipo || raw.type)?.cobertura : "") ||
    "N/A");

  const valorMensal = toNumberSafe(raw.valorMensal || raw.monthlyAmount) ?? 0;
  const premio = toNumberSafe(raw.premio || raw.premium) ?? 0;

  return {
    ...raw,
    seguradoraEmpresa,
    seguradoraEntidade,
    tipoCategoria,
    tipoCobertura,
    valorMensal,
    premio,
    // Also normalize the original fields to prevent rendering issues
    seguradora: seguradoraEmpresa,
    insurer: seguradoraEmpresa,
    tipo: tipoCategoria,
    type: tipoCategoria,
    name: typeof raw.name === "string" ? raw.name : (typeof raw.segurado === "string" ? raw.segurado : "N/A"),
    policyNumber: typeof raw.policyNumber === "string" ? raw.policyNumber : (typeof raw.numero_apolice === "string" ? raw.numero_apolice : "N/A"),
    // Garantir que documento e documento_tipo sejam preservados
    documento: raw.documento,
    documento_tipo: raw.documento_tipo
  };
}

// Helper de formatação de moeda
export const moedaBR = (v?: number | null) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "N/A";

// "Airbag" imediato para valores problemáticos
export const toDisplay = (v: any) => {
  if (v == null) return "N/A";
  if (typeof v === "object") {
    // tenta montar algo legível
    return Object.values(v).filter(Boolean).join(" · ") || "N/A";
  }
  return String(v);
};

// Helper adicional para renderização segura de texto
export const toText = (v: any): string => {
  if (v == null) return "N/A";
  if (typeof v === "object") {
    try {
      // monte algo legível: empresa · cobertura etc.
      return Object.values(v).filter(Boolean).join(" · ") || "N/A";
    } catch { 
      return "N/A"; 
    }
  }
  return String(v);
};