import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Loader2,
  Paperclip,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketAttachment {
  id: string;
  ticket_id: string;
  vehicle_id: string | null;
  tipo: string;
  nome_arquivo: string;
  file_path: string;
  file_url: string | null;
  tamanho_arquivo: number | null;
  tipo_mime: string | null;
  created_at: string;
}

interface TicketDocumentsTabProps {
  ticketId: string;
  ticketType: 'sinistro' | 'assistencia';
}

export function TicketDocumentsTab({ ticketId, ticketType }: TicketDocumentsTabProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAttachments();
  }, [ticketId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  /** Sanitiza nome para uso seguro como path no Supabase Storage. */
  const sanitizeFileName = (name: string): string => {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
  };

  const uploadSingleFile = async (file: File) => {
    const safeName = sanitizeFileName(file.name);
    // Caminho isolado por ticket (sinistro). Ex: tickets/<id>/<timestamp>-<arquivo>
    const filePath = `tickets/${ticketId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('ticket_attachments')
      .insert({
        ticket_id: ticketId,
        // Nome do arquivo é o "tipo" no sistema (legado da coluna obrigatória).
        tipo: file.name,
        nome_arquivo: file.name,
        file_path: filePath,
        file_url: urlData.publicUrl,
        tamanho_arquivo: file.size,
        tipo_mime: file.type || 'application/octet-stream',
      });

    if (dbError) throw dbError;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione ao menos um arquivo',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Uploads em paralelo (rápido para múltiplos anexos).
      const results = await Promise.allSettled(selectedFiles.map(uploadSingleFile));
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length === 0) {
        toast({
          title: 'Sucesso',
          description: `${selectedFiles.length} documento(s) enviado(s)`,
        });
      } else {
        toast({
          title: failed.length === selectedFiles.length ? 'Erro' : 'Parcialmente concluído',
          description: `${selectedFiles.length - failed.length} enviado(s), ${failed.length} falharam`,
          variant: failed.length === selectedFiles.length ? 'destructive' : 'default',
        });
      }

      setSelectedFiles([]);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await loadAttachments();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar os documentos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      if (filePath) {
        await supabase.storage.from('documents').remove([filePath]);
      }

      const { error } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento excluído com sucesso!',
      });

      loadAttachments();
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o documento',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5" />;
    
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      toast({
        title: 'Download iniciado',
        description: 'Preparando arquivo para download...',
      });

      // Fazer fetch do arquivo
      const response = await fetch(attachment.file_url || '');
      if (!response.ok) throw new Error('Erro ao baixar arquivo');
      
      const blob = await response.blob();
      
      // Criar URL do blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.nome_arquivo;
      link.style.display = 'none';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL do blob após um delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      toast({
        title: 'Download concluído',
        description: 'Arquivo baixado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-muted/50 rounded-lg p-6 border space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Upload className="h-5 w-5 text-primary" />
          <span>Adicionar Documento</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="file-upload">Arquivos *</Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          />
          <p className="text-xs text-muted-foreground">
            Selecione um ou mais arquivos. O nome de cada arquivo será usado como identificação no sistema.
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-background rounded p-3 border"
              >
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-xs shrink-0">({formatFileSize(file.size)})</span>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="w-full md:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {selectedFiles.length > 1
                ? `Enviar ${selectedFiles.length} Documentos`
                : 'Enviar Documento'}
            </>
          )}
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <FileText className="h-5 w-5 text-primary" />
          <span>Documentos Anexados</span>
          {attachments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({attachments.length})
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">
              Nenhum documento anexado ainda
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Use o formulário acima para adicionar documentos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-muted rounded">
                    {getFileIcon(attachment.tipo_mime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {attachment.nome_arquivo}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-primary">{attachment.tipo}</span>
                      <span>•</span>
                      <span>{formatFileSize(attachment.tamanho_arquivo)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(attachment)}
                    title="Baixar arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(attachment.id, attachment.file_path)}
                    title="Excluir documento"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
