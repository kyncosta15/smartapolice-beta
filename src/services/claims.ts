// Services para gerenciamento de sinistros

import { supabase } from '@/integrations/supabase/client';
import { Claim, ClaimEvent, Vehicle, Policy, Assistance } from '@/types/claims';

export class ClaimsService {
  // Mock data para demonstração - substituir por chamadas reais quando as tabelas estiverem criadas
  private static mockClaims: Claim[] = [
    {
      id: '1',
      ticket: 'SIN-2025-001',
      veiculo: {
        id: '1',
        placa: 'ABC1D23',
        marca: 'FIAT',
        modelo: 'ARGO',
        proprietario_nome: 'João Silva'
      },
      apolice: {
        id: '1',
        numero: 'AP-123456',
        seguradora: 'Porto Seguro'
      },
      status: 'aberto',
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z'
    }
  ];

  private static mockEvents: ClaimEvent[] = [
    {
      id: '1',
      claim_id: '1',
      tipo: 'abertura',
      descricao: 'Sinistro aberto',
      responsavel: 'Sistema',
      data: '2025-01-10T10:00:00Z'
    }
  ];

  static async getClaims(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status } = params;
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...this.mockClaims];
    
    if (search) {
      filtered = filtered.filter(claim => 
        claim.veiculo.placa.toLowerCase().includes(search.toLowerCase()) ||
        claim.veiculo.proprietario_nome?.toLowerCase().includes(search.toLowerCase()) ||
        `${claim.veiculo.marca} ${claim.veiculo.modelo}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(claim => claim.status === status);
    }
    
    return {
      data: filtered,
      total: filtered.length
    };
  }

  static async createClaim(claimData: Partial<Claim>) {
    // Simular criação
    await new Promise(resolve => setTimeout(resolve, 500));
    const newClaim: Claim = {
      id: Date.now().toString(),
      ticket: `SIN-${Date.now()}`,
      veiculo: claimData.veiculo!,
      apolice: claimData.apolice,
      status: 'aberto',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...claimData
    };
    this.mockClaims.push(newClaim);
    return newClaim;
  }

  static async getClaimById(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const claim = this.mockClaims.find(c => c.id === id);
    if (!claim) throw new Error('Sinistro não encontrado');
    return claim;
  }

  static async addClaimEvent(event: Omit<ClaimEvent, 'id'>) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newEvent: ClaimEvent = {
      id: Date.now().toString(),
      ...event
    };
    this.mockEvents.push(newEvent);
    return newEvent;
  }

  static async getClaimEvents(claimId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockEvents.filter(e => e.claim_id === claimId);
  }

  private static mockAssistances: Assistance[] = [
    {
      id: '1',
      tipo: 'guincho',
      veiculo: {
        id: '1',
        placa: 'ABC1D23',
        marca: 'FIAT',
        modelo: 'ARGO'
      },
      status: 'aberto',
      created_at: '2025-01-10T10:00:00Z'
    }
  ];

  static async getAssistances(params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, status } = params;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...this.mockAssistances];
    
    if (search) {
      filtered = filtered.filter(assistance => 
        assistance.veiculo.placa.toLowerCase().includes(search.toLowerCase()) ||
        `${assistance.veiculo.marca} ${assistance.veiculo.modelo}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(assistance => assistance.status === status);
    }
    
    return {
      data: filtered,
      total: filtered.length
    };
  }

  static async deleteClaim(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.mockClaims.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Sinistro não encontrado');
    this.mockClaims.splice(index, 1);
    return { success: true };
  }

  static async deleteAssistance(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = this.mockAssistances.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assistência não encontrada');
    this.mockAssistances.splice(index, 1);
    return { success: true };
  }
}