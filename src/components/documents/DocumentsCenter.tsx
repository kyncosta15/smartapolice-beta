import { useState } from 'react';
import { useDocuments, DocumentRecord, DocCategory } from './useDocuments';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload, Search, Grid3X3, List, FileText, Image, FileSpreadsheet,
  Eye, Download, Trash2, Loader2, FolderOpen, Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  APOLICE: 'Apólice',
  ENDOSSO: 'Endosso',
  BOLETO: 'Boleto',
  LAUDO: 'Laudo',
  CRLV: 'CRLV',
  CNH: 'CNH',
  FOTO: 'Foto',
  OUTROS: 'Outros',
};

const ENTITY_LABELS: Record<string, string> = {
  GERAL: 'Geral',
  VEICULO: 'Veículo',
  APOLICE: 'Apólice',
};

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    APOLICE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    ENDOSSO: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    BOLETO: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    LAUDO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    CRLV: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    CNH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    FOTO: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    OUTROS: 'bg-muted text-muted-foreground',
  };
  return map[cat] || map.OUTROS;
}

function getFileIcon(mime: string | null) {
  if (mime?.startsWith('image/')) return <Image className="h-4 w-4 text-pink-500" />;
  if (mime === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  if (mime?.includes('spreadsheet') || mime?.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

export function DocumentsCenter() {
  const { documents, loading, filters, setFilters, fetchDocuments, uploadDocument, getSignedUrl, softDelete, bulkSoftDelete, bulkUpdateCategory } = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleDownload = async (doc: DocumentRecord) => {
    const url = await getSignedUrl(doc.storage_path);
    if (!url) return;
    const resp = await fetch(url);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = doc.original_filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleUpload = async (file: File, meta: any) => {
    await uploadDocument(file, meta);
    fetchDocuments();
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    await bulkSoftDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    setBulkLoading(false);
  };

  const handleBulkCategoryChange = async (category: string) => {
    setBulkLoading(true);
    await bulkUpdateCategory(Array.from(selectedIds), category as DocCategory);
    setSelectedIds(new Set());
    setBulkLoading(false);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <Badge variant="secondary" className="text-sm font-semibold px-2.5 py-0.5">
            {documents.length}
          </Badge>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">Central de documentos — upload, organização e busca</p>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">
                {selectedIds.size} selecionado(s)
              </span>
              <div className="flex items-center gap-2">
                <Select onValueChange={handleBulkCategoryChange} disabled={bulkLoading}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      <span>Alterar categoria</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setBulkDeleteOpen(true)}
                  disabled={bulkLoading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir ({selectedIds.size})
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>
                Limpar seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, seguradora..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-9"
              />
            </div>
            <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.entityType} onValueChange={v => setFilters(f => ({ ...f, entityType: v === 'all' ? '' : v }))}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Vínculo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="GERAL">Geral</SelectItem>
                <SelectItem value="VEICULO">Veículo</SelectItem>
                <SelectItem value="APOLICE">Apólice</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="rounded-r-none" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" className="rounded-l-none" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">Faça upload do primeiro documento</p>
          <Button className="mt-4 gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Fazer Upload
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="w-10" />
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map(doc => (
                <TableRow key={doc.id} className={selectedIds.has(doc.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                    />
                  </TableCell>
                  <TableCell>{getFileIcon(doc.mime_type)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.original_filename}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(doc.category)}`}>
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{ENTITY_LABELS[doc.entity_type] || doc.entity_type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{doc.insurer || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(doc.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(doc)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-destructive" onClick={() => setDeleteDoc(doc)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {documents.map(doc => (
            <Card key={doc.id} className={`group hover:shadow-md transition-shadow cursor-pointer relative ${selectedIds.has(doc.id) ? 'ring-2 ring-primary' : ''}`} onClick={() => setPreviewDoc(doc)}>
              <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(doc.id)}
                  onCheckedChange={() => toggleSelect(doc.id)}
                />
              </div>
              <CardContent className="p-4 space-y-2 pt-8">
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.mime_type)}
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getCategoryColor(doc.category)}`}>
                    {CATEGORY_LABELS[doc.category]}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground truncate">{doc.original_filename}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatSize(doc.file_size)}</span>
                  <span>{format(new Date(doc.created_at), 'dd/MM/yy')}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                  <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                    <Download className="h-3 w-3 mr-1" /> Baixar
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDoc(doc); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal open={uploadOpen} onOpenChange={setUploadOpen} onUpload={handleUpload} />

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          fileName={previewDoc.original_filename}
          mimeType={previewDoc.mime_type}
          storagePath={previewDoc.storage_path}
          getSignedUrl={getSignedUrl}
        />
      )}

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento "{deleteDoc?.title}" será removido da listagem. Esta ação pode ser revertida pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteDoc) { softDelete(deleteDoc.id); setDeleteDoc(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} documento(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os documentos selecionados serão removidos da listagem. Esta ação pode ser revertida pelo administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
              disabled={bulkLoading}
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
