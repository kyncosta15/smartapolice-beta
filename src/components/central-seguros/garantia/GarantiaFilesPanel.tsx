import { useState, useCallback } from 'react';
import { Loader2, Upload, Paperclip } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GarantiaFilesPanel() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!documentNumber.trim()) {
      toast.error('Informe o número do documento');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Selecione ao menos um arquivo');
      return;
    }

    setUploading(true);
    try {
      const filesPayload = await Promise.all(
        selectedFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          return { name: file.name, base64, mimeType: file.type || 'application/octet-stream' };
        })
      );

      const { data, error } = await supabase.functions.invoke('junto-garantia-files', {
        body: {
          action: 'upload',
          documentNumber: documentNumber.trim(),
          files: filesPayload,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar arquivos');

      toast.success(`${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`);
      setSelectedFiles([]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [documentNumber, selectedFiles]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Paperclip className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Anexar Arquivos</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Anexe arquivos a uma cotação/proposta. Obrigatório quando a criação de minuta retorna <code className="bg-muted px-1 rounded">hasHangs: true</code>. Máximo 30MB por requisição.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Nº do Documento (documentNumber)</Label>
            <Input
              type="number"
              placeholder="Ex: 12345"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Arquivos</Label>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/30">
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Paperclip className="size-3" />
                <span>{f.name}</span>
                <span className="text-[10px]">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Upload className="size-4 mr-1.5" />
            )}
            Enviar Arquivo(s)
          </Button>
        </div>

        <div className="text-[10px] text-muted-foreground border-t border-border pt-3 space-y-1">
          <p><strong>Documentos necessários:</strong></p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Contrato e seus anexos</li>
            <li>Caso o contrato não esteja disponível: Edital + comprovante de vitória na concorrência</li>
            <li>Outros documentos que possam colaborar com a análise de risco</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
