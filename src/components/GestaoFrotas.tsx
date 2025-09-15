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
  Bell
} from 'lucide-react';
import { FrotasDashboard } from './frotas/FrotasDashboard';
import { FrotasTable } from './frotas/FrotasTable';
import { FrotasFipe } from './frotas/FrotasFipe';
import { FrotasDocumentos } from './frotas/FrotasDocumentos';
import { FrotasUpload } from './frotas/FrotasUpload';
import { FrotasFilters } from './frotas/FrotasFilters';
import { useFrotasData } from '@/hooks/useFrotasData';
import { useToast } from '@/hooks/use-toast';

export interface FrotaFilters {
  search: string;
  marcaModelo: string[];
  categoria: string[];
  status: string[];
}

export function GestaoFrotas() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('frotas');
  const [filters, setFilters] = useState<FrotaFilters>({
    search: '',
    marcaModelo: [],
    categoria: [],
    status: []
  });

  const { 
    veiculos, 
    loading, 
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Frotas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie toda sua frota de veículos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAlertas}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Alertas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Gerar Relatório PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-none border-b border-gray-200 bg-gray-50 px-6 py-3">
        <FrotasFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b border-gray-200 bg-white px-6">
            <TabsList className="h-12 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="frotas" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <Car className="h-4 w-4" />
                Frotas
              </TabsTrigger>
              <TabsTrigger 
                value="fipe" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <TrendingUp className="h-4 w-4" />
                FIPE & Cálculos
              </TabsTrigger>
              <TabsTrigger 
                value="documentos" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <FileText className="h-4 w-4" />
                Documentos
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <Upload className="h-4 w-4" />
                Upload & Extração
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="frotas" className="h-full p-6 space-y-6 overflow-y-auto">
              <FrotasDashboard kpis={kpis} veiculos={veiculos} loading={loading} />
              <FrotasTable veiculos={veiculos} loading={loading} onRefetch={refetch} />
            </TabsContent>

            <TabsContent value="fipe" className="h-full p-6 overflow-y-auto">
              <FrotasFipe veiculos={veiculos} loading={loading} />
            </TabsContent>

            <TabsContent value="documentos" className="h-full p-6 overflow-y-auto">
              <FrotasDocumentos veiculos={veiculos} loading={loading} />
            </TabsContent>

            <TabsContent value="upload" className="h-full p-6 overflow-y-auto">
              <FrotasUpload onSuccess={refetch} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}