import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FilePlus } from 'lucide-react';
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
}

export function EndossosCard({ policyId }: DocumentsCardProps) {
  const { toast } = useToast();
  const [endossos, setEndossos] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadEndossos();
  }, [policyId]);

  const loadEndossos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('policy_documents')
        .select('*')
        .eq('policy_id', policyId)
        .eq('tipo', 'endosso')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndossos(data || []);
    } catch (error) {
      console.error('Erro ao carregar endossos:', error);
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
      const filename = doc.nome_arquivo || `endosso.pdf`;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Se não há endossos, não mostrar o card
  if (!isLoading && endossos.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-50 pb-3 pt-4 px-4 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-800">
          <FilePlus className="h-5 w-5 text-amber-600" />
          Endossos ({endossos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {endossos.map((doc, index) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 hover:bg-amber-100/50 transition-colors border border-amber-200/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm shrink-0">
                    {endossos.length - index}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground">
                      Endosso Nº {endossos.length - index}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.nome_arquivo}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Anexado em {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="shrink-0 h-8 w-8 p-0 hover:bg-amber-200/50"
                  title="Baixar endosso"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 text-amber-700" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
