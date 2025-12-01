import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Trash2, 
  AlertCircle, 
  Mail 
} from 'lucide-react';
import { ClientReports } from '@/components/reports/ClientReports';
import { SendReportEmailModal } from '@/components/reports/SendReportEmailModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ExportRecord {
  id: string;
  file_name: string;
  export_date: string;
  export_time: string;
  dashboard_type: string;
  file_size_kb?: number;
  created_at: string;
}

export function ExportDashboard() {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar histórico do banco de dados
  const loadExportHistory = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('dashboard_exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        toast({
          title: "Erro ao carregar histórico",
          description: "Não foi possível carregar o histórico de exportações.",
          variant: "destructive"
        });
        return;
      }

      setExportHistory(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExportHistory();
  }, [user?.id]);

  // Adicionar nova exportação ao banco de dados
  const addExportRecord = async (fileName: string) => {
    if (!user?.id) return;

    try {
      const now = new Date();
      
      const { data, error } = await supabase
        .from('dashboard_exports')
        .insert([{
          user_id: user.id,
          file_name: fileName,
          export_date: now.toISOString().split('T')[0],
          export_time: now.toTimeString().split(' ')[0],
          dashboard_type: 'full',
          file_size_kb: null
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar exportação:', error);
        toast({
          title: "Erro ao salvar registro",
          description: "A exportação foi gerada mas não foi salva no histórico.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar o histórico local
      setExportHistory(prev => [data, ...prev].slice(0, 20));
      
      toast({
        title: "Registro salvo!",
        description: "A exportação foi adicionada ao histórico.",
      });
    } catch (error) {
      console.error('Erro inesperado ao salvar:', error);
    }
  };

  // Remover exportação do banco de dados
  const removeExportRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dashboard_exports')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Erro ao remover registro:', error);
        toast({
          title: "Erro ao remover",
          description: "Não foi possível remover o registro.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar o histórico local
      setExportHistory(prev => prev.filter(record => record.id !== id));
      
      toast({
        title: "Registro removido",
        description: "O registro foi removido do histórico.",
      });
    } catch (error) {
      console.error('Erro inesperado ao remover:', error);
    }
  };

  // Limpar todo o histórico
  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('dashboard_exports')
        .delete()
        .eq('user_id', user?.id);

      if (error) {
        console.error('Erro ao limpar histórico:', error);
        toast({
          title: "Erro ao limpar histórico",
          description: "Não foi possível limpar o histórico.",
          variant: "destructive"
        });
        return;
      }

      setExportHistory([]);
      
      toast({
        title: "Histórico limpo",
        description: "Todo o histórico de exportações foi removido.",
      });
    } catch (error) {
      console.error('Erro inesperado ao limpar:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Cabeçalho com ação de exportar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Relatório Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm md:text-base">
                Gere um relatório executivo completo com dashboards visuais, KPIs e insights automáticos.
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Inclui: gestão de frotas, sinistros, assistências e apólices de benefícios.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <ClientReports 
                onExportComplete={addExportRecord}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              />
              <Button 
                variant="outline" 
                size="default"
                className="rounded-xl border-gray-200 shadow-sm w-full sm:w-auto"
                onClick={() => setIsEmailModalOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate">Enviar por Email</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de exportações */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-5 w-5 text-green-600" />
            Histórico de Exportações
          </CardTitle>
          
          {exportHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-red-600 hover:text-red-700 w-full sm:w-auto"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar Histórico
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando histórico...</p>
            </div>
          ) : exportHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Nenhuma exportação realizada ainda</p>
              <p className="text-sm text-gray-400">
                Seus dashboards exportados aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {exportHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-2 md:gap-3 p-2.5 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg flex-shrink-0 mt-0.5">
                    <FileText className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-xs md:text-base leading-tight truncate pr-2">
                      {record.file_name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-0.5 text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1">
                      <span className="flex items-center gap-0.5 md:gap-1 whitespace-nowrap">
                        <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                        <span>{formatDate(record.export_date)}</span>
                      </span>
                      <span className="flex items-center gap-0.5 md:gap-1 whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                        <span>{formatTime(record.export_time)}</span>
                      </span>
                      <span className="hidden sm:inline capitalize">{record.dashboard_type}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExportRecord(record.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-7 w-7 md:h-8 md:w-8 p-0"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm md:text-base">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Sobre os Relatórios
            </h4>
            <ul className="text-xs md:text-sm space-y-1">
              <li>• Design executivo profissional no padrão RCORP</li>
              <li>• KPIs visuais e insights automáticos</li>
              <li>• Gráficos e tabelas estruturadas</li>
              <li>• Histórico sincronizado entre dispositivos</li>
              <li>• Dados salvos com segurança no banco</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Modal de envio por email */}
      <SendReportEmailModal 
        open={isEmailModalOpen} 
        onOpenChange={setIsEmailModalOpen} 
      />
    </div>
  );
}