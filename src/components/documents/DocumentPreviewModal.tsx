import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  mimeType: string | null;
  storagePath: string;
  getSignedUrl: (path: string) => Promise<string | null>;
}

export function DocumentPreviewModal({ open, onOpenChange, fileName, mimeType, storagePath, getSignedUrl }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getSignedUrl(storagePath).then(u => {
        setUrl(u);
        setLoading(false);
      });
    }
  }, [open, storagePath]);

  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const canPreview = isImage || isPdf;

  const handleDownload = async () => {
    if (!url) return;
    const resp = await fetch(url);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate text-sm">
            <FileText className="h-4 w-4 shrink-0" />
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] flex items-center justify-center">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : !url ? (
            <p className="text-muted-foreground">Erro ao carregar documento</p>
          ) : canPreview ? (
            isImage ? (
              <img src={url} alt={fileName} className="max-h-[60vh] object-contain rounded" />
            ) : (
              <iframe src={url} className="w-full h-[60vh] rounded border" title={fileName} />
            )
          ) : (
            <div className="text-center space-y-3">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">Preview não disponível para este tipo de arquivo</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {url && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Baixar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                </a>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
