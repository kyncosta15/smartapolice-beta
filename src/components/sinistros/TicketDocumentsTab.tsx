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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Atenção',
        description: 'Selecione um arquivo',
        variant: 'destructive',
      });
      return;
    }

    if (!documentType.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o tipo do documento',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload do arquivo para o storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${ticketId}-${Date.now()}.${fileExt}`;
      const filePath = `tickets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('🔍 DEBUG - Upload realizado:', {
        filePath,
        documentType: documentType.trim(),
        fileSize: selectedFile.size,
        fileName: selectedFile.name
      });

      // Salvar registro no banco
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .insert({
          ticket_id: ticketId,
          tipo: documentType.trim(),
          nome_arquivo: selectedFile.name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          tamanho_arquivo: selectedFile.size,
          tipo_mime: selectedFile.type || 'application/octet-stream',
        });

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw dbError;
      }

      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso!',
      });

      // Limpar form e recarregar
      setSelectedFile(null);
      setDocumentType('');
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await loadAttachments();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o documento',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      // Remover do storage
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

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-muted/50 rounded-lg p-6 border space-y-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Upload className="h-5 w-5 text-primary" />
          <span>Adicionar Documento</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Tipo de Documento *</Label>
            <Input
              id="document-type"
              placeholder="Ex: BO, Orçamento, Fotos"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file-upload">Arquivo *</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background rounded p-3 border">
            <Paperclip className="h-4 w-4" />
            <span className="font-medium">{selectedFile.name}</span>
            <span className="text-xs">({formatFileSize(selectedFile.size)})</span>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={uploading || !selectedFile || !documentType}
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
              Enviar Documento
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
                    asChild
                  >
                    <a href={attachment.file_url || '#'} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(attachment.id, attachment.file_path)}
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
