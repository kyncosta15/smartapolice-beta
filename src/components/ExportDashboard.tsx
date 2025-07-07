import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';
import { PDFExportButton } from '@/components/PDFExportButton';
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
    <div className="space-y-6">
      {/* Cabeçalho com ação de exportar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Exportar Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">
                Gere um PDF completo do seu dashboard atual com todas as métricas e gráficos.
              </p>
              <p className="text-sm text-gray-500">
                O arquivo será baixado automaticamente e salvo no histórico.
              </p>
            </div>
            
            <PDFExportButton 
              onExportComplete={addExportRecord}
            />
          </div>
        </CardContent>
      </Card>

      {/* Histórico de exportações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Histórico de Exportações
          </CardTitle>
          
          {exportHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-red-600 hover:text-red-700"
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
            <div className="space-y-3">
              {exportHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{record.file_name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(record.export_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(record.export_time)}
                        </span>
                        <span className="capitalize">{record.dashboard_type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExportRecord(record.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Informações sobre Exportação
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Os PDFs são gerados com alta qualidade (2x)</li>
              <li>• Incluem todas as métricas e gráficos visíveis</li>
              <li>• Histórico sincronizado entre dispositivos</li>
              <li>• Dados salvos com segurança no banco</li>
              <li>• Administradores podem ver todos os exports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}