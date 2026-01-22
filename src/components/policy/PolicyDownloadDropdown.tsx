import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Loader2, ChevronDown, FileStack } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PolicyDocument {
  tipo: string;
  path: string;
  nome?: string;
}

interface PolicyDownloadDropdownProps {
  policyId: string;
  policyName: string;
  arquivoUrl?: string | null;
  nosnum?: number;
  codfil?: number;
  onDownloadStart?: () => void;
  className?: string;
}

export function PolicyDownloadDropdown({
  policyId,
  policyName,
  arquivoUrl,
  nosnum,
  codfil,
  onDownloadStart,
  className
}: PolicyDownloadDropdownProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);

  // Carregar documentos disponíveis ao abrir dropdown
  const loadDocuments = async () => {
    if (hasLoadedDocs) return;
    
    const docs: PolicyDocument[] = [];
    
    // Adicionar arquivo principal se existir
    if (arquivoUrl && arquivoUrl !== 'Não informado' && arquivoUrl.trim() !== '') {
      const tipoFromPath = arquivoUrl.includes('endosso') 
        ? 'Endosso' 
        : arquivoUrl.includes('renovacao') 
          ? 'Renovação' 
          : 'Apólice';
      
      docs.push({
        tipo: tipoFromPath,
        path: arquivoUrl,
        nome: `${tipoFromPath} - ${policyName}`
      });
    }

    // Se tiver nosnum/codfil, tentar buscar da API InfoCap
    if (nosnum && codfil) {
      try {
        const { getDocumentoAnexos } = await import('@/services/corpnuvem/anexos');
        const response = await getDocumentoAnexos({ codfil, nosnum });
        
        if (response?.anexos && response.anexos.length > 0) {
          response.anexos.forEach((anexo: any, idx: number) => {
            if (anexo.tipo?.toLowerCase().includes('pdf')) {
              docs.push({
                tipo: anexo.descricao || `Documento ${idx + 1}`,
                path: anexo.url,
                nome: anexo.descricao || `Documento ${idx + 1}`
              });
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Não foi possível carregar anexos da API InfoCap:', error);
      }
    }
    
    setDocuments(docs);
    setHasLoadedDocs(true);
  };

  // Download de um documento específico
  const handleDownloadSingle = async (doc: PolicyDocument) => {
    setIsLoading(true);
    onDownloadStart?.();

    try {
      toast({
        title: "⏳ Download iniciado",
        description: `Baixando ${doc.nome || doc.tipo}...`,
      });

      // Se for URL externa (InfoCap), usar método diferente
      if (doc.path.startsWith('http')) {
        const { downloadDocumentoAnexo } = await import('@/services/corpnuvem/anexos');
        await downloadDocumentoAnexo(doc.path, `${doc.nome || policyName}.pdf`);
        
        toast({
          title: "✅ Download concluído",
          description: `${doc.nome || doc.tipo} baixado com sucesso`,
        });
        return;
      }

      // Download do bucket via edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ pdfPath: doc.path }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no download');
      }

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const filename = `${doc.nome || policyName}.pdf`;

      // Criar link e fazer download
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
        description: `${doc.nome || doc.tipo} baixado com sucesso`,
      });

    } catch (error: any) {
      console.error('❌ Erro no download:', error);
      toast({
        title: "❌ Erro no Download",
        description: error.message || "Não foi possível obter o arquivo PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download de todos os documentos
  const handleDownloadAll = async () => {
    if (documents.length === 0) return;
    
    for (const doc of documents) {
      await handleDownloadSingle(doc);
    }
  };

  const hasDocuments = arquivoUrl || (nosnum && codfil);

  if (!hasDocuments) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={className}
        title="Nenhum arquivo disponível"
      >
        <Download className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // Se só tiver um documento possível, mostrar botão simples
  if (!nosnum && !codfil && arquivoUrl) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDownloadSingle({ tipo: 'Apólice', path: arquivoUrl })}
        disabled={isLoading}
        className={className}
        title="Baixar apólice"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && loadDocuments()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={className}
          title="Opções de download"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {documents.length === 0 && hasLoadedDocs && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Nenhum documento disponível
          </DropdownMenuItem>
        )}
        
        {documents.map((doc, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => handleDownloadSingle(doc)}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2 text-primary" />
            <span className="truncate">{doc.nome || doc.tipo}</span>
          </DropdownMenuItem>
        ))}

        {documents.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDownloadAll}
              className="cursor-pointer font-medium"
            >
              <FileStack className="h-4 w-4 mr-2 text-primary" />
              Baixar todos ({documents.length})
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
