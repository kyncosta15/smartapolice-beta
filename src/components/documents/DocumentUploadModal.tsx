import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { EntityType, DocCategory } from './useDocuments';

const CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: 'APOLICE', label: 'Apólice' },
  { value: 'ENDOSSO', label: 'Endosso' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'LAUDO', label: 'Laudo' },
  { value: 'CRLV', label: 'CRLV' },
  { value: 'CNH', label: 'CNH' },
  { value: 'FOTO', label: 'Foto' },
  { value: 'OUTROS', label: 'Outros' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, meta: {
    title: string;
    entity_type: EntityType;
    category: DocCategory;
    vehicle_id?: string;
    policy_id?: string;
    insurer?: string;
    tags?: string[];
    description?: string;
    document_date?: string;
  }) => Promise<void>;
}

export function DocumentUploadModal({ open, onOpenChange, onUpload }: Props) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocCategory>('OUTROS');
  const [entityType, setEntityType] = useState<EntityType>('GERAL');
  const [insurer, setInsurer] = useState('');
  const [description, setDescription] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleSubmit = async () => {
    if (!file || !title.trim()) {
      toast({ title: 'Preencha o título e selecione um arquivo', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await onUpload(file, {
        title: title.trim(),
        entity_type: entityType,
        category,
        insurer: insurer.trim() || undefined,
        description: description.trim() || undefined,
        document_date: documentDate || undefined,
        tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
      toast({ title: '✅ Documento enviado com sucesso' });
      resetAndClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro ao enviar documento', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setTitle('');
    setCategory('OUTROS');
    setEntityType('GERAL');
    setInsurer('');
    setDescription('');
    setDocumentDate('');
    setTagsInput('');
    onOpenChange(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload de Documento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[280px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">PDF, imagens, Office — máx 20MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do documento" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Categoria *</Label>
              <Select value={category} onValueChange={v => setCategory(v as DocCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Entity type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Vínculo</Label>
              <Select value={entityType} onValueChange={v => setEntityType(v as EntityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GERAL">Geral</SelectItem>
                  <SelectItem value="VEICULO">Veículo</SelectItem>
                  <SelectItem value="APOLICE">Apólice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Insurer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Seguradora</Label>
              <Input value={insurer} onChange={e => setInsurer(e.target.value)} placeholder="Ex: Porto Seguro" />
            </div>

            {/* Document date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data do documento</Label>
              <Input type="date" value={documentDate} onChange={e => setDocumentDate(e.target.value)} />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tags (separar por vírgula)</Label>
            <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="ex: urgente, renovação" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Observações sobre o documento..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetAndClose} disabled={uploading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!file || !title.trim() || uploading}>
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4 mr-2" />Enviar</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
