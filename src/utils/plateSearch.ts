/**
 * Utilitários para busca flexível por placa de veículo.
 * Aceita tanto o formato antigo (AAA1234) quanto o Mercosul (AAA1A23),
 * com ou sem hífen (AAA-1234 / AAA-1A23).
 */

const PLATE_REGEX = /^[A-Z]{3}-?[0-9][0-9A-Z][0-9]{2}$/i;

/** Remove tudo que não for letra/número e converte para maiúsculas. */
export function normalizePlate(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** Verifica se a string parece uma placa (com ou sem hífen). */
export function looksLikePlate(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return PLATE_REGEX.test(trimmed);
}

/**
 * Gera variantes de busca para uma placa: sem hífen e com hífen.
 * Retorna array vazio se a entrada não tiver pelo menos 2 caracteres
 * alfanuméricos contínuos.
 */
export function plateVariants(input: string): string[] {
  const clean = normalizePlate(input);
  if (clean.length < 2) return [];

  const variants = new Set<string>([clean]);

  // Insere hífen entre as 3 letras iniciais e o restante (se houver)
  if (clean.length > 3 && /^[A-Z]{3}/.test(clean)) {
    variants.add(`${clean.slice(0, 3)}-${clean.slice(3)}`);
  }

  return Array.from(variants);
}
