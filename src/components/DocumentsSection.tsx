import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  Eye, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentoColaborador {
  id: string;
  tipo_documento: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  created_at: string;
}

interface DocumentsSectionProps {
  colaboradorId: string;
}

export function DocumentsSection({ colaboradorId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentoColaborador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('🔄 DocumentsSection loaded for colaborador:', colaboradorId);
    fetchDocuments();
  }, [colaboradorId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching documents for colaborador:', colaboradorId);
      
      const { data, error } = await supabase
        .from('colaborador_documentos')
        .select('*')
        .eq('colaborador_id', colaboradorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching documents:', error);
        throw error;
      }

      console.log('📄 Documents found:', data);
      setDocuments(data || []);
    } catch (err) {
      console.error('❌ Error fetching documents:', err);
      toast({
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível carregar os documentos do colaborador',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentTypeLabel = (tipo: string) => {
    const types = {
      'documento_pessoal': 'Documento Pessoal',
      'comprovante_residencia': 'Comprovante de Residência',
      'comprovacao_vinculo': 'Comprovação de Vínculo'
    };
    return types[tipo as keyof typeof types] || tipo;
  };

  const getDocumentTypeColor = (tipo: string) => {
    const colors = {
      'documento_pessoal': 'bg-blue-100 text-blue-800',
      'comprovante_residencia': 'bg-green-100 text-green-800',
      'comprovacao_vinculo': 'bg-purple-100 text-purple-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (document: DocumentoColaborador) => {
    try {
      setDownloadingIds(prev => new Set(prev).add(document.id));
      console.log('📥 Starting download for:', document.storage_path);
      
      const { data, error } = await supabase.storage
        .from('smartbeneficios')
        .download(document.storage_path);

      if (error) {
        console.error('❌ Download error:', error);
        throw error;
      }

      console.log('✅ File downloaded successfully');

      // Criar blob com MIME type explícito para PDF
      const pdfBlob = new Blob([data], { type: 'application/pdf' });
      const filename = document.nome_arquivo;
      
      // Verificar se Web Share API está disponível (iOS/Safari)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          
          // Verificar se pode compartilhar arquivos
          if (navigator.canShare({ files: [file] })) {
            console.log('📱 Usando Web Share API (iOS nativo)');
            await navigator.share({
              title: filename.replace('.pdf', ''),
              text: `Documento ${filename}`,
              files: [file]
            });
            
            toast({
              title: 'Download concluído',
              description: `${filename} foi salvo com sucesso`
            });
            
            return;
          }
        } catch (shareError: any) {
          // Usuário cancelou
          if (shareError.name === 'AbortError') {
            console.log('ℹ️ Usuário cancelou o compartilhamento');
            return;
          }
          console.log('⚠️ Web Share não disponível, usando fallback');
        }
      }
      
      // Fallback: Download tradicional otimizado para mobile
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      link.target = '_self'; // Evita abrir em nova aba
      
      window.document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: 'Download iniciado',
        description: `${filename} está sendo baixado`
      });
    } catch (err) {
      console.error('❌ Error downloading file:', err);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive'
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const handlePreview = async (document: DocumentoColaborador) => {
    try {
      console.log('👁️ Preview for:', document.storage_path);
      
      const { data, error } = await supabase.storage
        .from('smartbeneficios')
        .createSignedUrl(document.storage_path, 300); // 5 minutes

      if (error) {
        console.error('❌ Preview error:', error);
        throw error;
      }

      window.open(data.signedUrl, '_blank');
    } catch (err) {
      console.error('❌ Error creating preview:', err);
      toast({
        title: 'Erro na visualização',
        description: 'Não foi possível visualizar o arquivo',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          <Label className="text-sm sm:text-base">Documentos</Label>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
          <Label className="text-sm sm:text-base">Documentos ({documents.length})</Label>
        </div>
        {documents.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {documents.length} arquivo{documents.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Separator />

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum documento encontrado</p>
          <p className="text-xs mt-1">
            Os documentos são enviados durante o cadastro do colaborador
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="font-medium text-sm truncate">
                    {doc.nome_arquivo}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getDocumentTypeColor(doc.tipo_documento)}`}
                  >
                    {getDocumentTypeLabel(doc.tipo_documento)}
                  </Badge>
                  <span>{formatFileSize(doc.tamanho_arquivo)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-2 sm:mt-0 sm:ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(doc)}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingIds.has(doc.id)}
                  className="text-xs"
                >
                  {downloadingIds.has(doc.id) ? (
                    <>
                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}