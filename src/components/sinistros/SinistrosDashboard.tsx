import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KpiBlock } from './KpiBlock';
import { useSinistrosKpis } from '@/hooks/useSinistrosKpis';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  Plus,
  Wrench,
  Activity
} from 'lucide-react';

// Types
interface BaseItem {
  id: string;
  tipo: 'sinistro' | 'assistencia';
  status: string;
  created_at: string;
  seguradora?: string;
  placa?: string;
  chassi?: string;
  proprietario_nome?: string;
  modelo?: string;
}

interface SinistrosDashboardProps {
  onNavigateToList?: (scope: 'all' | 'claims' | 'assists', filter?: string, value?: string) => void;
  onNewTicket?: () => void;
}

// Mock data - replace with real data from API
const mockItems: BaseItem[] = [
  {
    id: '1', tipo: 'sinistro', status: 'open', created_at: '2025-01-10T10:00:00Z',
    seguradora: 'Porto Seguro', placa: 'ABC1D23', proprietario_nome: 'João Silva', modelo: 'Argo'
  },
  {
    id: '2', tipo: 'sinistro', status: 'closed', created_at: '2025-01-05T15:30:00Z',
    seguradora: 'Bradesco Seguros', placa: 'XYZ9W87', proprietario_nome: 'Maria Santos', modelo: 'Civic'
  },
  {
    id: '3', tipo: 'assistencia', status: 'open', created_at: '2025-01-12T09:00:00Z',
    seguradora: 'Suhai Seguradora', placa: 'DEF4G56', proprietario_nome: 'Pedro Oliveira', modelo: 'Onix'
  },
  {
    id: '4', tipo: 'assistencia', status: 'closed', created_at: '2024-12-20T14:00:00Z',
    seguradora: 'Allianz', placa: 'GHI7J89', proprietario_nome: 'Ana Costa', modelo: 'HB20'
  }
];

export function SinistrosDashboard({ 
  onNavigateToList,
  onNewTicket 
}: SinistrosDashboardProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [seguradoraFilter, setSeguradoraFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate KPIs using the custom hook
  const kpis = useSinistrosKpis(mockItems, {
    status: statusFilter,
    seguradora: seguradoraFilter,
    search: searchTerm
  });

  const handleCardClick = (scope: 'all' | 'claims' | 'assists', filter?: string, value?: string) => {
    onNavigateToList?.(scope, filter, value);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 space-y-8">
      {/* Header with filters and search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="open">Em Aberto</SelectItem>
              <SelectItem value="closed">Finalizados</SelectItem>
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

        <div className="flex gap-3 w-full lg:w-auto">
          <Input
            placeholder="Buscar por placa, chassi, proprietário ou modelo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full lg:w-80"
          />
          <Button 
            onClick={onNewTicket}
            className="shrink-0"
            title="Abrir novo ticket"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Ticket
          </Button>
        </div>
      </div>

      {/* Dashboard blocks */}
      <div className="space-y-8">
        {/* Bloco 1 - Geral */}
        <KpiBlock
          title="Total (Sinistros & Assistências)"
          totalCard={{
            value: kpis.geral.total,
            subtitle: 'casos totais',
            icon: Activity,
            onClick: () => handleCardClick('all')
          }}
          smallCards={[
            {
              title: 'Em Aberto',
              value: kpis.geral.emAberto,
              subtitle: 'casos em aberto',
              icon: Clock,
              variant: 'open',
              onClick: () => handleCardClick('all', 'status', 'open')
            },
            {
              title: 'Finalizados',
              value: kpis.geral.finalizados,
              subtitle: 'casos finalizados',
              icon: CheckCircle,
              variant: 'closed',
              onClick: () => handleCardClick('all', 'status', 'closed')
            },
            {
              title: 'Últimos 60 dias',
              value: kpis.geral.ult60d,
              subtitle: 'casos recentes',
              icon: Calendar,
              variant: 'recent',
              onClick: () => handleCardClick('all', 'range', 'last60d')
            }
          ]}
        />

        {/* Bloco 2 - Somente Sinistros */}
        <KpiBlock
          title="Total de Sinistros"
          totalCard={{
            value: kpis.sinistros.total,
            subtitle: 'sinistros totais',
            icon: FileText,
            onClick: () => handleCardClick('claims')
          }}
          smallCards={[
            {
              title: 'Em Aberto',
              value: kpis.sinistros.emAberto,
              subtitle: 'sinistros em aberto',
              icon: Clock,
              variant: 'open',
              onClick: () => handleCardClick('claims', 'status', 'open')
            },
            {
              title: 'Finalizados',
              value: kpis.sinistros.finalizados,
              subtitle: 'sinistros finalizados',
              icon: CheckCircle,
              variant: 'closed',
              onClick: () => handleCardClick('claims', 'status', 'closed')
            },
            {
              title: 'Últimos 60 dias',
              value: kpis.sinistros.ult60d,
              subtitle: 'sinistros recentes',
              icon: Calendar,
              variant: 'recent',
              onClick: () => handleCardClick('claims', 'range', 'last60d')
            }
          ]}
        />

        {/* Bloco 3 - Somente Assistências */}
        <KpiBlock
          title="Total de Assistências"
          totalCard={{
            value: kpis.assistencias.total,
            subtitle: 'assistências totais',
            icon: Wrench,
            onClick: () => handleCardClick('assists')
          }}
          smallCards={[
            {
              title: 'Em Aberto',
              value: kpis.assistencias.emAberto,
              subtitle: 'assistências em aberto',
              icon: Clock,
              variant: 'open',
              onClick: () => handleCardClick('assists', 'status', 'open')
            },
            {
              title: 'Finalizados',
              value: kpis.assistencias.finalizados,
              subtitle: 'assistências finalizadas',
              icon: CheckCircle,
              variant: 'closed',
              onClick: () => handleCardClick('assists', 'status', 'closed')
            },
            {
              title: 'Últimos 60 dias',
              value: kpis.assistencias.ult60d,
              subtitle: 'assistências recentes',
              icon: Calendar,
              variant: 'recent',
              onClick: () => handleCardClick('assists', 'range', 'last60d')
            }
          ]}
        />
      </div>
    </div>
  );
}