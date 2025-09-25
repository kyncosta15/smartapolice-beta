import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, Eye, Trash2, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';

interface VehicleDocument {
  id: string;
  tipo: string;
  nome_arquivo: string;
  url: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  created_at: string;
  origem: string;
}

interface VehicleDocumentsSectionProps {
  vehicleId: string;
  mode?: 'view' | 'edit';
}

export function VehicleDocumentsSection({ vehicleId, mode = 'view' }: VehicleDocumentsSectionProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      fetchDocuments();
    }
  }, [vehicleId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('frota_documentos')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast.error('Erro ao carregar documentos do veículo');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = async (files: Array<{ file: File; id: string; url?: string }>) => {
    if (!vehicleId) return;

    setUploading(true);
    try {
      // Inserir registros dos documentos na tabela frota_documentos
      const documentsToInsert = files.map(({ file, url }) => ({
        veiculo_id: vehicleId,
        tipo: getDocumentType(file.name),
        nome_arquivo: file.name,
        url: url || '',
        tamanho_arquivo: file.size,
        tipo_mime: file.type,
        origem: 'upload' as const,
      }));

      const { error } = await supabase
        .from('frota_documentos')
        .insert(documentsToInsert);

      if (error) throw error;

      toast.success(`${files.length} documento(s) adicionado(s) com sucesso!`);
      fetchDocuments(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar documentos:', error);
      toast.error('Erro ao salvar documentos no sistema');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      pdf: 'PDF',
      doc: 'DOC',
      docx: 'DOCX',
      jpg: 'Imagem',
      jpeg: 'Imagem',
      png: 'Imagem',
      xls: 'Planilha',
      xlsx: 'Planilha',
    };
    return typeMap[ext || ''] || 'Documento';
  };

  const getStatusBadge = (origem: string) => {
    const config = {
      upload: { color: 'bg-blue-100 text-blue-800', label: 'Uploaded' },
      import: { color: 'bg-green-100 text-green-800', label: 'Importado' },
      external: { color: 'bg-purple-100 text-purple-800', label: 'Externo' },
    };
    
    const statusConfig = config[origem as keyof typeof config] || config.upload;
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamanho desconhecido';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = (doc: VehicleDocument) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = doc.nome_arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('frota_documentos')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast.success('Documento removido com sucesso!');
      fetchDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao remover documento');
    }
  };

  if (loading) {
    return (
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-500">Carregando documentos...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-3 md:p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            Documentos do Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          
          {/* Upload de novos documentos */}
          {mode === 'edit' && (
            <div className="mb-6">
              <DragDropUpload
                onFilesChange={handleFilesUploaded}
                bucketName="frotas_docs"
                maxFiles={10}
                maxSize={20 * 1024 * 1024} // 20MB
                acceptedTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/jpg', 
                  'image/png',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]}
                disabled={uploading}
              />
            </div>
          )}

          {/* Lista de documentos */}
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm">Nenhum documento encontrado</p>
                {mode === 'edit' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Adicione documentos usando a área de upload acima
                  </p>
                )}
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
                        {getStatusBadge(doc.origem)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{doc.tipo}</span>
                        <span>{formatFileSize(doc.tamanho_arquivo)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(doc.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </Button>
                    {mode === 'edit' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}