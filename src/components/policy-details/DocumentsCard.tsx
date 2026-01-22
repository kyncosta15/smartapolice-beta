import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, FilePlus, RefreshCw, Files } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PolicyDocument {
  id: string;
  tipo: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho_bytes: number | null;
  created_at: string;
}

interface DocumentsCardProps {
  policyId: string;
  arquivoUrl?: string | null;
}

export function DocumentsCard({ policyId, arquivoUrl }: DocumentsCardProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [policyId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('policy_documents')
        .select('*')
        .eq('policy_id', policyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: PolicyDocument) => {
    setDownloadingId(doc.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ pdfPath: doc.storage_path }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no download');
      }

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const filename = doc.nome_arquivo || `${doc.tipo}.pdf`;

      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);

      toast({
        title: "✅ Download concluído",
        description: `${filename} baixado com sucesso`,
      });

    } catch (error: any) {
      console.error('Erro no download:', error);
      toast({
        title: "❌ Erro no Download",
        description: error.message || "Não foi possível obter o arquivo",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'endosso':
        return <FilePlus className="h-5 w-5 text-amber-600" />;
      case 'renovacao':
        return <RefreshCw className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  const getDocumentLabel = (tipo: string) => {
    switch (tipo) {
      case 'endosso':
        return 'Endosso';
      case 'renovacao':
        return 'Renovação';
      case 'apolice':
        return 'Apólice';
      default:
        return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // Se não há documentos na nova tabela e não há arquivo_url, não mostrar o card
  if (!isLoading && documents.length === 0 && !arquivoUrl) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 pb-3 pt-4 px-4 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
          <Files className="h-5 w-5 text-primary" />
          Documentos Anexos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getDocumentIcon(doc.tipo)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">
                      {getDocumentLabel(doc.tipo)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.nome_arquivo}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDate(doc.created_at)}
                      {doc.tamanho_bytes && ` • ${formatFileSize(doc.tamanho_bytes)}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="shrink-0 h-8 w-8 p-0"
                  title="Baixar documento"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : arquivoUrl && arquivoUrl !== 'Não informado' ? (
          // Fallback para arquivo_url legado
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  Documento da Apólice
                </p>
                <p className="text-xs text-muted-foreground">
                  Arquivo disponível para download
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload({
                id: 'legacy',
                tipo: 'apolice',
                nome_arquivo: 'apolice.pdf',
                storage_path: arquivoUrl,
                tamanho_bytes: null,
                created_at: new Date().toISOString()
              })}
              disabled={downloadingId === 'legacy'}
              className="shrink-0 h-8 w-8 p-0"
            >
              {downloadingId === 'legacy' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum documento anexado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
