// Services para busca de veículos

import { supabase } from '@/integrations/supabase/client';
import { Vehicle, Policy } from '@/types/claims';

export class VehiclesService {
  // Mock data expandido para testes mais realistas
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
    },
    {
      id: '3',
      placa: 'BRA2E88',
      chassi: '11111222223333444',
      marca: 'CHEVROLET',
      modelo: 'ONIX',
      proprietario_nome: 'Pedro Oliveira',
      proprietario_tipo: 'pf'
    },
    {
      id: '4',
      placa: 'DEF5G67',
      chassi: '55556666777788889',
      marca: 'HYUNDAI',
      modelo: 'HB20',
      proprietario_nome: 'Ana Costa',
      proprietario_tipo: 'pf'
    },
    {
      id: '5',
      placa: 'GHI8H90',
      chassi: '99990000111122223',
      marca: 'TOYOTA',
      modelo: 'COROLLA',
      proprietario_nome: 'Empresa ABC Ltda',
      proprietario_tipo: 'pj'
    },
    {
      id: '6',
      placa: 'JKL1M23',
      chassi: '33334444555566667',
      marca: 'HONDA',
      modelo: 'CIVIC',
      proprietario_nome: 'Roberto Lima',
      proprietario_tipo: 'pf'
    },
    {
      id: '7',
      placa: 'MNO4P56',
      chassi: '77778888999900001',
      marca: 'RENAULT',
      modelo: 'SANDERO',
      proprietario_nome: 'Transportadora XYZ',
      proprietario_tipo: 'pj'
    },
    {
      id: '8',
      placa: 'PQR7S89',
      chassi: '11112222333344445',
      marca: 'FORD',
      modelo: 'KA',
      proprietario_nome: 'Carla Ferreira',
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
    },
    {
      id: '2',
      numero: 'SU-789012',
      seguradora: 'SulAmérica',
      vigencia_inicio: '2024-06-15',
      vigencia_fim: '2025-06-14',
      veiculo_id: '2'
    },
    {
      id: '3',
      numero: 'AZ-345678',
      seguradora: 'Azul Seguros',
      vigencia_inicio: '2024-09-01',
      vigencia_fim: '2025-08-31',
      veiculo_id: '3'
    },
    {
      id: '4',
      numero: 'BR-901234',
      seguradora: 'Bradesco Seguros',
      vigencia_inicio: '2024-11-20',
      vigencia_fim: '2025-11-19',
      veiculo_id: '5'
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