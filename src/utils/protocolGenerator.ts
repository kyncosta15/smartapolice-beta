// Gerador de protocol_code sequencial

let sequenceCounter = 1;

export function generateProtocolCode(): string {
  const year = new Date().getFullYear();
  const sequence = String(sequenceCounter).padStart(6, '0');
  sequenceCounter++;
  
  return `SB-${year}-${sequence}`;
}

// Reseta contador (útil para testes)
export function resetSequence(): void {
  sequenceCounter = 1;
}