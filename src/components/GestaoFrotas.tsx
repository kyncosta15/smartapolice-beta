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
  Settings
} from 'lucide-react';
import { FrotasDashboard } from './frotas/FrotasDashboard';
import { FrotasTable } from './frotas/FrotasTable';
import { FrotasKPICards } from './frotas/FrotasKPICards';
import { FrotasFipe } from './frotas/FrotasFipe';
import { FrotasDocumentos } from './frotas/FrotasDocumentos';
import { FrotasUpload } from './frotas/FrotasUpload';
import { IntegracaoN8NTest } from './frotas/IntegracaoN8NTest';
import { ImportConfigurationPage } from './frotas/ImportConfigurationPage';
import { FrotasFilters } from './frotas/FrotasFilters';
import { PolicyHeader } from './frotas/PolicyHeader';
import { SinistrosDashboard } from './frotas/SinistrosDashboard';
import { AssistenciaDashboard } from './frotas/AssistenciaDashboard';
import { useFrotasData } from '@/hooks/useFrotasData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FrotaFilters {
  search: string;
  marcaModelo: string[];
  categoria: string[];
  status: string[];
}

export function GestaoFrotas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('frotas');
  const [filters, setFilters] = useState<FrotaFilters>({
    search: '',
    marcaModelo: [],
    categoria: [],
    status: []
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-gray-500 mb-4">
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
      <div className="flex-none border-b border-gray-200 bg-white py-3 sm:py-4 md:py-6 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words leading-tight">
              Gestão de Frotas
            </h1>
            <p className="text-sm text-gray-500 mt-1 break-words">
              Gerencie toda sua frota de veículos
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAlertas}
              className="flex items-center gap-2 h-10 px-3"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2 h-10 px-3"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Tabs and Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0">
          <div className="flex-none border-b border-gray-200 bg-white">
            <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
              <nav className="inline-flex gap-1 px-3 sm:px-4 lg:px-6 py-2">
                <TabsList className="h-10 sm:h-12 p-1 bg-gray-100 rounded-lg flex-shrink-0">
                  <TabsTrigger 
                    value="frotas" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Car className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Frotas</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fipe" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>FIPE</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documentos" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Docs</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Upload & N8N</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="config" 
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>Configurações</span>
                  </TabsTrigger>
                </TabsList>
              </nav>
            </div>
          </div>
        
          {/* KPI Cards - shown right after tabs */}
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-6 border-b border-gray-200 bg-gray-50">
            <FrotasKPICards kpis={kpis} loading={loading} />
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 bg-gray-50">
            <TabsContent value="frotas" className="h-full flex flex-col min-h-0 p-3 sm:p-4 md:p-6 m-0">
              <FrotasDashboard 
                kpis={kpis} 
                veiculos={veiculos} 
                loading={loading} 
                searchLoading={searchLoading}
                onRefetch={refetch}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </TabsContent>

            <TabsContent value="sinistros" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <SinistrosDashboard loading={loading} />
            </TabsContent>

            <TabsContent value="assistencia" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <AssistenciaDashboard loading={loading} />
            </TabsContent>

            <TabsContent value="fipe" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <FrotasFipe veiculos={veiculos} loading={loading} />
            </TabsContent>

            <TabsContent value="documentos" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <FrotasDocumentos veiculos={veiculos} loading={loading} />
            </TabsContent>

            <TabsContent value="upload" className="h-full p-3 sm:p-4 md:p-6 overflow-y-auto m-0">
              <div className="space-y-6">
                {/* Teste da Integração N8N */}
                <IntegracaoN8NTest onSuccess={refetch} />
                
                {/* Upload de arquivos tradicional */}
                <FrotasUpload onSuccess={refetch} />
              </div>
            </TabsContent>

            <TabsContent value="config" className="h-full overflow-y-auto m-0">
              <ImportConfigurationPage />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}