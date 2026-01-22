import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, FileText, RefreshCw, FilePlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type DocumentType = 'apolice' | 'endosso' | 'renovacao';

interface PolicyDocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyId?: string;
  userId: string;
  onUploadComplete?: (path: string, type: DocumentType) => void;
}

export function PolicyDocumentUploadModal({
  open,
  onOpenChange,
  policyId,
  userId,
  onUploadComplete
}: PolicyDocumentUploadModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('apolice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Sanitizar nome do arquivo
      const sanitizedFileName = selectedFile.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase();
      
      // Adicionar prefixo baseado no tipo de documento
      const typePrefix = documentType;
      const fileName = `${userId}/${typePrefix}_${Date.now()}_${sanitizedFileName}`;

      // Upload para o bucket 'pdfs' (mesmo usado pelo N8N)
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload concluído:', data.path);

      // Se tiver policy_id, inserir na tabela policy_documents E atualizar arquivo_url
      if (policyId) {
        // 1. Inserir na nova tabela policy_documents para manter histórico
        const { error: insertError } = await (supabase as any)
          .from('policy_documents')
          .insert({
            policy_id: policyId,
            user_id: userId,
            tipo: documentType,
            nome_arquivo: selectedFile.name,
            storage_path: data.path,
            tamanho_bytes: selectedFile.size,
          });

        if (insertError) {
          console.error('Erro ao registrar documento:', insertError);
        }

        // 2. Atualizar arquivo_url para manter compatibilidade com fluxos existentes
        const { error: updateError } = await supabase
          .from('policies')
          .update({ arquivo_url: data.path })
          .eq('id', policyId);

        if (updateError) {
          console.error('Erro ao atualizar apólice:', updateError);
        }
      }

      setUploadStatus('success');
      toast({
        title: "✅ Upload concluído",
        description: `Documento de ${documentType === 'apolice' ? 'apólice' : documentType === 'endosso' ? 'endosso' : 'renovação'} enviado com sucesso`,
      });

      onUploadComplete?.(data.path, documentType);

      // Fechar modal após sucesso
      setTimeout(() => {
        onOpenChange(false);
        resetState();
      }, 1500);

    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível enviar o documento",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setDocumentType('apolice');
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const documentTypes = [
    { value: 'apolice', label: 'Apólice', icon: FileText, description: 'Documento original da apólice' },
    { value: 'endosso', label: 'Endosso', icon: FilePlus, description: 'Alteração contratual' },
    { value: 'renovacao', label: 'Renovação', icon: RefreshCw, description: 'Renovação da apólice' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload de Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de tipo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Documento</Label>
            <RadioGroup
              value={documentType}
              onValueChange={(v) => setDocumentType(v as DocumentType)}
              className="grid grid-cols-3 gap-2"
            >
              {documentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Label
                    key={type.value}
                    htmlFor={type.value}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      documentType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <Icon className={cn(
                      "h-5 w-5",
                      documentType === type.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-xs font-medium text-center",
                      documentType === type.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {type.label}
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Área de upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Arquivo PDF</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                selectedFile
                  ? "border-green-300 bg-green-50"
                  : "border-muted hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um PDF
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Upload concluído com sucesso!</span>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Erro ao enviar documento</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
