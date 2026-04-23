import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Upload, X, FileText, Loader2, Layers, Copy, Check, ChevronsUpDown, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { EntityType, DocCategory } from './useDocuments';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserPoliciesLite } from '@/hooks/useUserPoliciesLite';
import { cn } from '@/lib/utils';

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

interface FileMeta {
  id: string;
  file: File;
  title: string;
  category: DocCategory;
  entityType: EntityType;
  insurer: string;
  description: string;
  documentDate: string;
  tagsInput: string;
  policyId: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMessage?: string;
}

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
  const [items, setItems] = useState<FileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const { policies: userPolicies, loading: loadingPolicies } = useUserPoliciesLite();
  const [openPolicyPickerFor, setOpenPolicyPickerFor] = useState<string | null>(null);

  const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    const newItems: FileMeta[] = accepted.map(f => ({
      id: makeId(),
      file: f,
      title: f.name.replace(/\.[^.]+$/, ''),
      category: 'OUTROS',
      entityType: 'GERAL',
      insurer: '',
      description: '',
      documentDate: '',
      tagsInput: '',
      status: 'pending',
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
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

  const updateItem = (id: string, patch: Partial<FileMeta>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const applyToAll = (sourceId: string) => {
    const source = items.find(it => it.id === sourceId);
    if (!source) return;
    setItems(prev => prev.map(it => it.id === sourceId ? it : ({
      ...it,
      category: source.category,
      entityType: source.entityType,
      insurer: source.insurer,
      documentDate: source.documentDate,
      tagsInput: source.tagsInput,
    })));
    toast({ title: '✅ Aplicado a todos os arquivos' });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({ title: 'Selecione ao menos um arquivo', variant: 'destructive' });
      return;
    }
    const invalid = items.find(it => !it.title.trim());
    if (invalid) {
      toast({ title: 'Preencha o título de todos os arquivos', variant: 'destructive' });
      return;
    }

    setUploading(true);
    let okCount = 0;
    let errCount = 0;

    for (const it of items) {
      if (it.status === 'done') { okCount++; continue; }
      updateItem(it.id, { status: 'uploading', errorMessage: undefined });
      try {
        await onUpload(it.file, {
          title: it.title.trim(),
          entity_type: it.entityType,
          category: it.category,
          insurer: it.insurer.trim() || undefined,
          description: it.description.trim() || undefined,
          document_date: it.documentDate || undefined,
          tags: it.tagsInput ? it.tagsInput.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        });
        updateItem(it.id, { status: 'done' });
        okCount++;
      } catch (err: any) {
        console.error(err);
        updateItem(it.id, { status: 'error', errorMessage: err.message });
        errCount++;
      }
    }

    setUploading(false);
    if (errCount === 0) {
      toast({ title: `✅ ${okCount} documento(s) enviado(s) com sucesso` });
      resetAndClose();
    } else {
      toast({
        title: `${okCount} enviado(s), ${errCount} com erro`,
        description: 'Verifique os arquivos marcados em vermelho.',
        variant: 'destructive',
      });
    }
  };

  const resetAndClose = () => {
    setItems([]);
    onOpenChange(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const isMass = items.length > 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload de Documento{isMass ? 's' : ''}
            {isMass && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Layers className="h-3 w-3" />
                {items.length} arquivos
              </Badge>
            )}
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
            <div className="space-y-1">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                {items.length > 0 ? 'Adicionar mais arquivos' : 'Arraste ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground">
                Vários arquivos suportados — PDF, imagens, Office — máx 20MB cada
              </p>
            </div>
          </div>

          {/* Lista de arquivos com formulários por linha */}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className={`rounded-lg border p-4 space-y-3 ${
                    it.status === 'error'
                      ? 'border-destructive/50 bg-destructive/5'
                      : it.status === 'done'
                      ? 'border-success/40 bg-success/5'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  {/* Cabeçalho do arquivo */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {idx + 1}. {it.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(it.file.size)}
                          {it.status === 'done' && <span className="ml-2 text-success">✓ Enviado</span>}
                          {it.status === 'uploading' && <span className="ml-2 text-primary">Enviando…</span>}
                          {it.status === 'error' && <span className="ml-2 text-destructive">Erro: {it.errorMessage}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isMass && it.status === 'pending' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => applyToAll(it.id)}
                          title="Aplicar metadados deste arquivo a todos os outros"
                        >
                          <Copy className="h-3 w-3" />
                          Aplicar a todos
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeItem(it.id)}
                        disabled={uploading && it.status === 'uploading'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Campos do arquivo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium">Título *</Label>
                      <Input
                        value={it.title}
                        onChange={e => updateItem(it.id, { title: e.target.value })}
                        placeholder="Nome do documento"
                        disabled={it.status === 'done'}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Categoria *</Label>
                      <Select
                        value={it.category}
                        onValueChange={v => updateItem(it.id, { category: v as DocCategory })}
                        disabled={it.status === 'done'}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Vínculo</Label>
                      <Select
                        value={it.entityType}
                        onValueChange={v => updateItem(it.id, { entityType: v as EntityType })}
                        disabled={it.status === 'done'}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GERAL">Geral</SelectItem>
                          <SelectItem value="VEICULO">Veículo</SelectItem>
                          <SelectItem value="APOLICE">Apólice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Seguradora</Label>
                      <Input
                        value={it.insurer}
                        onChange={e => updateItem(it.id, { insurer: e.target.value })}
                        placeholder="Ex: Porto Seguro"
                        disabled={it.status === 'done'}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Data do documento</Label>
                      <Input
                        type="date"
                        value={it.documentDate}
                        onChange={e => updateItem(it.id, { documentDate: e.target.value })}
                        disabled={it.status === 'done'}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium">Tags (separar por vírgula)</Label>
                      <Input
                        value={it.tagsInput}
                        onChange={e => updateItem(it.id, { tagsInput: e.target.value })}
                        placeholder="ex: urgente, renovação"
                        disabled={it.status === 'done'}
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-medium">Observações</Label>
                      <Textarea
                        value={it.description}
                        onChange={e => updateItem(it.id, { description: e.target.value })}
                        rows={2}
                        placeholder="Observações sobre o documento..."
                        disabled={it.status === 'done'}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={resetAndClose} disabled={uploading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={items.length === 0 || uploading}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Enviar {items.length > 0 ? `${items.length} arquivo${items.length > 1 ? 's' : ''}` : ''}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
