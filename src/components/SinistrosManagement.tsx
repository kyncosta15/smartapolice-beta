import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClaimsManager } from './claims/ClaimsManager';
import { TicketsDashboard } from './tickets/TicketsDashboard';
import { AssistanceFloatingButton } from './tickets/AssistanceFloatingButton';
import { SinistrosDashboard } from './sinistros/SinistrosDashboard';
import { SinistrosCRLV } from './sinistros/SinistrosCRLV';
import { SinistrosRelatorios } from './sinistros/SinistrosRelatorios';
import { SinistrosConfiguracoes } from './sinistros/SinistrosConfiguracoes';
import { HamburgerMenu } from './sinistros/HamburgerMenu';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { normalizePolicy } from '@/lib/policies';

interface SinistrosManagementProps {
  allPolicies: ParsedPolicyData[];
  onPolicyUpdate: (policy: any) => void;
  onPolicySelect: (policy: any) => void;
}

export function SinistrosManagement({ 
  allPolicies, 
  onPolicyUpdate, 
  onPolicySelect 
}: SinistrosManagementProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Extract vehicles from policies for sinistros context
  const vehicles = useMemo(() => {
    return allPolicies.map(policy => {
      // Normalize policy to ensure all fields are strings
      const normalized = normalizePolicy(policy);
      
      return {
        id: policy.id,
        placa: policy.vehicleDetails?.plate || 'N/A',
        marca: policy.vehicleDetails?.brand || 'N/A',
        modelo: policy.vehicleDetails?.model || policy.vehicleModel || 'N/A',
        year: policy.vehicleDetails?.year || 'N/A',
        categoria: 'PASSEIO', // Default category
        apoliceNumero: normalized.policyNumber || 'N/A',
        seguradora: normalized.insurer || 'N/A',
        cliente: {
          nome: normalized.name || 'N/A',
          cpf: policy.documento_tipo === 'CPF' ? policy.documento : null,
          cnpj: policy.documento_tipo === 'CNPJ' ? policy.documento : null
        }
      };
    });
  }, [allPolicies]);

  // Mock sinistros data for demo
  const mockSinistros = [
    {
      id: '1',
      numero_sinistro: 'SIN-2025-001',
      ticket_id: 'TKT-001',
      status: 'EM_ANALISE',
      tipo_evento: 'COLISAO',
      gravidade: 'MEDIA',
      data_abertura: '2025-01-10',
      created_at: '2025-01-10T10:00:00Z',
      closed_at: null,
      veiculo: { placa: 'ABC1D23', marca: 'FIAT', modelo: 'ARGO' },
      seguradora: 'Porto Seguro',
      financeiro: {
        reserva_tecnica: 500000, // R$ 5.000,00 em centavos
        indenizacao_prevista: 300000,
        gastos_reparo_previstos: 200000
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with hamburger menu */}
      <div className="flex items-center gap-4">
        <HamburgerMenu 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Sinistros</h1>
          <p className="text-muted-foreground">
            Abertura, acompanhamento e relatórios de sinistros
          </p>
        </div>
      </div>

      {/* Content based on active tab - no visible tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

        <TabsContent value="dashboard">
          <SinistrosDashboard 
            onNavigateToList={(scope, filter, value) => {
              console.log('Navigate to list:', scope, filter, value);
              // TODO: Implement navigation logic
            }}
            onNewTicket={() => {
              console.log('Open new ticket modal');
              // TODO: Implement new ticket modal
            }}
          />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsDashboard />
        </TabsContent>

        <TabsContent value="novo">
          <ClaimsManager 
            onClaimEdit={onPolicySelect}
          />
        </TabsContent>

        <TabsContent value="crlv">
          <SinistrosCRLV 
            vehicles={vehicles}
            onCRLVUpdated={(crlv) => console.log('CRLV updated:', crlv)}
          />
        </TabsContent>

        <TabsContent value="relatorios">
          <SinistrosRelatorios 
            sinistros={mockSinistros}
            vehicles={vehicles}
            policies={allPolicies}
          />
        </TabsContent>

        <TabsContent value="config">
          <SinistrosConfiguracoes 
            onConfigSaved={(config) => console.log('Config saved:', config)}
          />
        </TabsContent>
        </Tabs>

        {/* Botão Flutuante de Assistência 24h */}
        <AssistanceFloatingButton />
      </div>
  );
}