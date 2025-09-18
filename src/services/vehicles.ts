// Services para busca de veículos

import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Policy } from '@/types/claims';

export class VehiclesService {
  // Mock data para demonstração
  private static mockVehicles: Vehicle[] = [
    {
      id: '1',
      placa: 'ABC1D23',
      chassi: '12345678901234567',
      marca: 'FIAT',
      modelo: 'ARGO',
      proprietario_nome: 'João Silva',
      proprietario_tipo: 'pf'
    },
    {
      id: '2',
      placa: 'XYZ9876',
      chassi: '98765432109876543',
      marca: 'VOLKSWAGEN',
      modelo: 'GOL',
      proprietario_nome: 'Maria Santos',
      proprietario_tipo: 'pf'
    }
  ];

  private static mockPolicies: Policy[] = [
    {
      id: '1',
      numero: 'AP-123456',
      seguradora: 'Porto Seguro',
      vigencia_inicio: '2025-01-01',
      vigencia_fim: '2025-12-31',
      veiculo_id: '1'
    }
  ];

  static async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query || query.length < 2) return [];

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    return this.mockVehicles.filter(vehicle =>
      vehicle.placa.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.marca?.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.modelo?.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.proprietario_nome?.toLowerCase().includes(query.toLowerCase()) ||
      vehicle.chassi?.toLowerCase().includes(query.toLowerCase())
    );
  }

  static async getPolicyByVehicleId(vehicleId: string): Promise<Policy | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockPolicies.find(policy => policy.veiculo_id === vehicleId) || null;
  }

  static async markCRLVAsPaid(crlvId: string): Promise<void> {
    // Simular operação
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`CRLV ${crlvId} marcado como pago`);
  }
}