import { useMemo } from 'react';
import { Claim, Assistance } from '@/types/claims';

export interface ClaimsStats {
  totais: { 
    tickets: number; 
    ultimos60d: number; 
  };
  sinistros: { 
    total: number; 
    abertos: number; 
    finalizados: number; 
  };
  assistencias: { 
    total: number; 
    abertos: number; 
    finalizados: number; 
  };
}

const OPEN_STATUSES = ['aberto', 'em_analise', 'em_andamento', 'open'];
const CLOSED_STATUSES = ['finalizado', 'encerrado', 'pago', 'closed'];

function isOpen(status: string): boolean {
  return OPEN_STATUSES.includes(status?.toLowerCase());
}

function isClosed(status: string): boolean {
  return CLOSED_STATUSES.includes(status?.toLowerCase());
}

function isLast60Days(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 60);
  return date >= cutoff;
}

export function useClaimsStats(
  claims: Claim[] = [], 
  assistances: Assistance[] = []
): ClaimsStats {
  return useMemo(() => {
    // Calcular estatísticas dos sinistros
    const sinistrosTotal = claims.length;
    const sinistrosAbertos = claims.filter(claim => isOpen(claim.status)).length;
    const sinistrosFinalizados = claims.filter(claim => isClosed(claim.status)).length;

    // Calcular estatísticas das assistências  
    const assistenciasTotal = assistances.length;
    const assistenciasAbertas = assistances.filter(assistance => isOpen(assistance.status)).length;
    const assistenciasFinalizadas = assistances.filter(assistance => isClosed(assistance.status)).length;

    // Calcular totais gerais
    const totalTickets = sinistrosTotal + assistenciasTotal;
    const totalUltimos60d = [
      ...claims.filter(claim => isLast60Days(claim.created_at)),
      ...assistances.filter(assistance => isLast60Days(assistance.created_at))
    ].length;

    return {
      totais: {
        tickets: totalTickets,
        ultimos60d: totalUltimos60d
      },
      sinistros: {
        total: sinistrosTotal,
        abertos: sinistrosAbertos,
        finalizados: sinistrosFinalizados
      },
      assistencias: {
        total: assistenciasTotal,
        abertos: assistenciasAbertas,
        finalizados: assistenciasFinalizadas
      }
    };
  }, [claims, assistances]);
}