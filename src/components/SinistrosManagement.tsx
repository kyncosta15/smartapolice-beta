import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SinistrosDashboard } from './sinistros/SinistrosDashboard';
import { SinistrosCasos } from './sinistros/SinistrosCasos';
import { SinistrosNovoTicket } from './sinistros/SinistrosNovoTicket';
import { SinistrosMovimentacoes } from './sinistros/SinistrosMovimentacoes';
import { SinistrosCRLV } from './sinistros/SinistrosCRLV';
import { SinistrosRelatorios } from './sinistros/SinistrosRelatorios';
import { SinistrosConfiguracoes } from './sinistros/SinistrosConfiguracoes';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  Search, 
  Filter,
  Plus,
  FileText,
  Calculator,
  Car,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seguradoraFilter, setSeguradoraFilter] = useState('');

  // Extract vehicles from policies for sinistros context
  const vehicles = useMemo(() => {
    return allPolicies.map(policy => ({
      id: policy.id,
      placa: policy.vehicleDetails?.plate || 'N/A',
      marca: policy.vehicleDetails?.brand || 'N/A',
      modelo: policy.vehicleDetails?.model || policy.vehicleModel || 'N/A',
      year: policy.vehicleDetails?.year || 'N/A',
      categoria: 'PASSEIO', // Default category
      apoliceNumero: policy.policyNumber || 'N/A',
      seguradora: policy.insurer || 'N/A',
      cliente: {
        nome: policy.insuredName || policy.name || 'N/A',
        cpf: policy.documento_tipo === 'CPF' ? policy.documento : null,
        cnpj: policy.documento_tipo === 'CNPJ' ? policy.documento : null
      }
    }));
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
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Sinistros</h1>
          <p className="text-muted-foreground">
            Abertura, acompanhamento e relatórios de sinistros
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por placa, CPF, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ABERTO">Aberto</SelectItem>
            <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
            <SelectItem value="DOCUMENTACAO_PENDENTE">Doc. Pendente</SelectItem>
            <SelectItem value="EM_REGULACAO">Em Regulação</SelectItem>
            <SelectItem value="EM_REPARO">Em Reparo</SelectItem>
            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={seguradoraFilter} onValueChange={setSeguradoraFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seguradora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as seguradoras</SelectItem>
            <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
            <SelectItem value="Bradesco Seguros">Bradesco Seguros</SelectItem>
            <SelectItem value="Suhai Seguradora">Suhai Seguradora</SelectItem>
            <SelectItem value="Allianz">Allianz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="casos" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Casos
          </TabsTrigger>
          <TabsTrigger value="novo" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Ticket
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="crlv" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            CRLV
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SinistrosDashboard 
            sinistros={mockSinistros}
            vehicles={vehicles}
            policies={allPolicies}
          />
        </TabsContent>

        <TabsContent value="casos">
          <SinistrosCasos 
            sinistros={mockSinistros}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            seguradoraFilter={seguradoraFilter}
            onCaseSelect={onPolicySelect}
          />
        </TabsContent>

        <TabsContent value="novo">
          <SinistrosNovoTicket 
            vehicles={vehicles}
            policies={allPolicies}
            onTicketCreated={(ticket) => console.log('Ticket created:', ticket)}
          />
        </TabsContent>

        <TabsContent value="movimentacoes">
          <SinistrosMovimentacoes 
            vehicles={vehicles}
            onMovimentacaoCreated={(mov) => console.log('Movimentação created:', mov)}
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
    </div>
  );
}