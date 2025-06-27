
export interface InstallmentAnalysis {
  vencidas: number;
  aVencer: number;
  proximoVencimento: string | null;
}

export class InstallmentAnalyzer {
  static analyzeInstallments(vencimentosFuturos: string[]): InstallmentAnalysis {
    const hoje = new Date();
    const vencimentos = vencimentosFuturos || [];

    let vencidas = 0;
    let aVencer = 0;
    let proximoVencimento: string | null = null;

    for (const data of vencimentos) {
      const venc = new Date(data + "T00:00:00"); // evita problemas de fuso

      if (venc < hoje) {
        vencidas++;
      } else {
        aVencer++;
        if (!proximoVencimento || venc < new Date(proximoVencimento + "T00:00:00")) {
          proximoVencimento = venc.toISOString().split("T")[0];
        }
      }
    }

    console.log(`📊 Análise de vencimentos:`, {
      total: vencimentos.length,
      vencidas,
      aVencer,
      proximoVencimento,
      hoje: hoje.toISOString().split("T")[0]
    });

    return {
      vencidas,
      aVencer,
      proximoVencimento
    };
  }

  static getOverdueInstallments(vencimentosFuturos: string[], monthlyValue: number): Array<{numero: number, valor: number, data: string, status: 'pendente'}> {
    const hoje = new Date();
    const overdue = [];

    vencimentosFuturos.forEach((data, index) => {
      const venc = new Date(data + "T00:00:00");
      
      if (venc < hoje) {
        overdue.push({
          numero: index + 1,
          valor: monthlyValue,
          data: data,
          status: 'pendente' as const
        });
      }
    });

    return overdue;
  }

  static getUpcomingInstallments(vencimentosFuturos: string[], monthlyValue: number): Array<{numero: number, valor: number, data: string, status: 'pendente'}> {
    const hoje = new Date();
    const upcoming = [];

    vencimentosFuturos.forEach((data, index) => {
      const venc = new Date(data + "T00:00:00");
      
      if (venc >= hoje) {
        upcoming.push({
          numero: index + 1,
          valor: monthlyValue,
          data: data,
          status: 'pendente' as const
        });
      }
    });

    return upcoming.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }
}
