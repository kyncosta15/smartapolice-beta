import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileSpreadsheet, 
  Calendar, 
  HardDrive, 
  Users, 
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { usePlanilhaUploads, PlanilhaUpload } from '@/hooks/usePlanilhaUploads';
import { useToast } from '@/hooks/use-toast';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusIcon = (status: PlanilhaUpload['status']) => {
  switch (status) {
    case 'processando':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'processado':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'erro':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'cancelado':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: PlanilhaUpload['status']) => {
  const variants = {
    processando: 'secondary',
    processado: 'default',
    erro: 'destructive',
    cancelado: 'outline'
  } as const;

  const labels = {
    processando: 'Processando',
    processado: 'Processado',
    erro: 'Erro',
    cancelado: 'Cancelado'
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {getStatusIcon(status)}
      <span className="ml-1">{labels[status]}</span>
    </Badge>
  );
};

export const PlanilhaHistorico = () => {
  const { uploads, isLoading, deleteUpload } = usePlanilhaUploads();
  const { toast } = useToast();

  const handleDelete = async (uploadId: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`)) {
      return;
    }

    const { error } = await deleteUpload(uploadId);
    
    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Arquivo excluído",
        description: "O arquivo e seus dados foram removidos com sucesso"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Planilhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Histórico de Planilhas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma planilha foi enviada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {upload.nome_arquivo}
                    </p>
                    <div className="flex items-center mt-1 space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <HardDrive className="h-3 w-3 mr-1" />
                        {formatFileSize(upload.tamanho_arquivo)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(upload.data_upload)}
                      </div>
                      {upload.colaboradores_importados > 0 && (
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {upload.colaboradores_importados} colaboradores
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(upload.status)}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(upload.id, upload.nome_arquivo)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};