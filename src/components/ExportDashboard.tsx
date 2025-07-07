import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Clock, Trash2 } from 'lucide-react';
import { PDFExportButton } from '@/components/PDFExportButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ExportRecord {
  id: string;
  fileName: string;
  exportDate: string;
  exportTime: string;
  userName: string;
  fileSize?: string;
}

export function ExportDashboard() {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('dashboard-export-history');
    if (savedHistory) {
      try {
        setExportHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Salvar histórico no localStorage
  const saveHistory = (history: ExportRecord[]) => {
    localStorage.setItem('dashboard-export-history', JSON.stringify(history));
    setExportHistory(history);
  };

  // Adicionar nova exportação ao histórico
  const addExportRecord = (fileName: string) => {
    const newRecord: ExportRecord = {
      id: `export-${Date.now()}`,
      fileName,
      exportDate: new Date().toLocaleDateString('pt-BR'),
      exportTime: new Date().toLocaleTimeString('pt-BR'),
      userName: user?.name || 'Usuário',
      fileSize: 'N/A'
    };

    const updatedHistory = [newRecord, ...exportHistory].slice(0, 20); // Manter apenas os últimos 20
    saveHistory(updatedHistory);
  };

  // Remover exportação do histórico
  const removeExportRecord = (id: string) => {
    const updatedHistory = exportHistory.filter(record => record.id !== id);
    saveHistory(updatedHistory);
    
    toast({
      title: "Registro removido",
      description: "O registro foi removido do histórico.",
    });
  };

  // Limpar todo o histórico
  const clearHistory = () => {
    saveHistory([]);
    toast({
      title: "Histórico limpo",
      description: "Todo o histórico de exportações foi removido.",
    });
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
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar Histórico
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {exportHistory.length === 0 ? (
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
                      <h4 className="font-medium text-gray-900">{record.fileName}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {record.exportDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {record.exportTime}
                        </span>
                        <span>Por: {record.userName}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExportRecord(record.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informações sobre Exportação</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Os PDFs são gerados com alta qualidade (2x)</li>
              <li>• Incluem todas as métricas e gráficos visíveis</li>
              <li>• Histórico mantém os últimos 20 registros</li>
              <li>• Arquivos são baixados automaticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}