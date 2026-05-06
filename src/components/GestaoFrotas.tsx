import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Upload,
  Search,
  Filter,
  FileText,
  Bell,
  Shield,
  Database,
  RefreshCw,
  Settings,
  Link,
  FileBarChart,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { FrotasDashboard } from './frotas/FrotasDashboard';
import { FrotasReports } from './frotas/FrotasReports';
import { FrotasTable } from './frotas/FrotasTable';
import { FrotasKPICards } from './frotas/FrotasKPICards';
import { FrotasFipeNew } from './frotas/FrotasFipeNew';
import { FrotasDocumentos } from './frotas/FrotasDocumentos';
import { FrotasUpload } from './frotas/FrotasUpload';
import { FipeSpreadsheetUpload } from './frotas/FipeSpreadsheetUpload';
import { BatchFipeUpdate } from './frotas/BatchFipeUpdate';

import { ImportConfigurationPage } from './frotas/ImportConfigurationPage';
import { FrotasFilters } from './frotas/FrotasFilters';
import { PolicyHeader } from './frotas/PolicyHeader';
import { SinistrosDashboard } from './frotas/SinistrosDashboard';
import { AssistenciaDashboard } from './frotas/AssistenciaDashboard';

import { FleetRequestsList } from './fleet-requests/FleetRequestsList';
import { PublicLinkGenerator } from './fleet-requests/PublicLinkGenerator';
import { FleetTemplateDownload } from './frotas/FleetTemplateDownload';
import { TheftRiskDashboard } from './frotas/TheftRiskDashboard';
import OperationalDataImportDialog from './frotas/OperationalDataImportDialog';
import { ClipboardList } from 'lucide-react';

import { useFrotasData } from '@/hooks/useFrotasData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FrotaFilters {
  search: string;
  marcaModelo: string[];
  modelo: string[];
  categoria: string[];
  status: string[];
  ordenacao: string;
  quitado?: string; // 'sim' | 'nao' | undefined
  banco?: string;
  revisao?: string; // 'com_revisao' | 'sem_revisao' | undefined
}

export function GestaoFrotas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('frotas');
  
  const [publicLinkModalOpen, setPublicLinkModalOpen] = useState(false);
  const [filters, setFilters] = useState<FrotaFilters>({
    search: '',
    marcaModelo: [],
    modelo: [],
    categoria: [],
    status: [],
    ordenacao: 'padrao'
  });

  // Mock policies data - replace with real data from your API
  const [policies] = useState([
    {
      id: '1',
      seguradora: 'Porto Seguro',
      numero_apolice: '123456789',
      inicio_vigencia: '2025-01-01',
      fim_vigencia: '2025-12-31',
      status: 'ativa' as const,
      tipo_beneficio: 'Frota'
    }
  ]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id);

  const { 
    veiculos, 
    allVeiculos,
    loading, 
    searchLoading,
    error, 
    refetch,
    kpis 
  } = useFrotasData(filters);

  const handleFilterChange = (newFilters: Partial<FrotaFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExportPDF = async () => {
    toast({
      title: "Relatório em preparação",
      description: "O relatório PDF será gerado em breve...",
    });
    
    // TODO: Implementar geração de PDF
    setTimeout(() => {
      toast({
        title: "Relatório pronto",
        description: "O relatório foi gerado com sucesso!",
      });
    }, 3000);
  };

  const handleAlertas = () => {
    toast({
      title: "Alertas ativos",
      description: `${kpis.semSeguro} veículos sem seguro, ${kpis.emplacamentoVencido} com emplacamento vencido`,
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados da frota
          </p>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 w-full">
      {/* Header */}
      <div className="flex-none border-b border-border bg-background py-3 sm:py-4 md:py-6 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words leading-tight">
              Gestão de Frotas
            </h1>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              Gerencie toda sua frota de veículos
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast({
                  title: "🔄 Lista atualizada",
                  description: "Os dados da frota foram recarregados",
                });
              }}
              disabled={loading}
              className="flex items-center gap-2 h-10 px-3"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPublicLinkModalOpen(true)}
              className="flex items-center gap-2 h-10 px-3"
            >
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Gerar link externo</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Tabs and Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0">
          <div className="flex-none border-b border-border bg-background">
            <nav className="px-3 sm:px-4 lg:px-6 py-2">
              <TabsList className="h-11 p-1 bg-muted rounded-lg w-full grid grid-cols-7 gap-0.5">
                <TabsTrigger
                  value="frotas"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <Car className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Frotas</span>
                </TabsTrigger>
                <TabsTrigger
                  value="fipe"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">FIPE</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sinistros"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Sinistros</span>
                </TabsTrigger>
                <TabsTrigger
                  value="solicitacoes"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Tickets</span>
                </TabsTrigger>
                <TabsTrigger
                  value="documentos"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Documentos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="relatorios"
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap min-w-0"
                >
                  <FileBarChart className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Relatórios</span>
                </TabsTrigger>
              </TabsList>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 bg-muted/30 dark:bg-background">
            <TabsContent value="frotas" className="h-full flex flex-col min-h-0 m-0">
              {/* KPI Cards - apenas na aba Frotas */}
              <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-6 border-b border-border bg-muted/30 dark:bg-card/50">
                <FrotasKPICards kpis={kpis} loading={loading} hasData={!loading || allVeiculos.length > 0} />
              </div>
              
              <div className="p-3 sm:p-4 md:p-6">
                <FrotasDashboard
                kpis={kpis} 
                veiculos={veiculos}
                allVeiculos={allVeiculos}
                loading={loading} 
                searchLoading={searchLoading}
                onRefetch={refetch}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              </div>
            </TabsContent>

            <TabsContent value="sinistros" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <SinistrosDashboard loading={loading} />
            </TabsContent>

            <TabsContent value="assistencia" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <AssistenciaDashboard loading={loading} />
            </TabsContent>

            <TabsContent value="fipe" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <div className="mb-4 flex justify-end gap-2">
                <BatchFipeUpdate onSuccess={refetch} />
                <FipeSpreadsheetUpload onSuccess={refetch} />
              </div>
              
              <FrotasFipeNew 
                veiculos={veiculos.length === 0 ? allVeiculos : veiculos} 
                loading={loading}
                hasActiveFilters={
                  filters.search !== '' ||
                  filters.categoria.length > 0 || 
                  filters.status.length > 0 || 
                  filters.marcaModelo.length > 0
                }
                onVehicleUpdate={refetch}
              />
            </TabsContent>

            <TabsContent value="documentos" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <FrotasDocumentos veiculos={veiculos} loading={loading} />
            </TabsContent>

            <TabsContent value="upload" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <div className="mb-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpImportOpen(true)}>
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                  Importar Dados Operacionais
                </Button>
                <FleetTemplateDownload variant="secondary" />
              </div>
              <FrotasUpload onSuccess={refetch} />
            </TabsContent>

            <TabsContent value="risco" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <TheftRiskDashboard 
                veiculos={veiculos} 
                allVeiculos={allVeiculos} 
                loading={loading} 
              />
            </TabsContent>

            <TabsContent value="solicitacoes" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <FleetRequestsList />
            </TabsContent>

            <TabsContent value="relatorios" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <FrotasReports veiculos={allVeiculos} loading={loading} />
            </TabsContent>
          </div>
        </Tabs>
      </div>


      {/* Public Link Generator Modal */}
      <PublicLinkGenerator 
        open={publicLinkModalOpen} 
        onOpenChange={setPublicLinkModalOpen} 
      />
    </div>
  );
}