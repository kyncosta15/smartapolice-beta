import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FrotaVeiculo } from '@/hooks/useFrotasData';

interface BulkDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculos: FrotaVeiculo[];
  onCompleted?: () => void;
}

const tipoDocumentoOptions = [
  { value: 'crlv', label: 'CRLV' },
  { value: 'nf', label: 'Nota Fiscal' },
  { value: 'termo_responsabilidade', label: 'Termo de Responsabilidade' },
  { value: 'termo_devolucao', label: 'Termo de Devolução' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outro', label: 'Outro' },
];

type ItemStatus = 'pending' | 'uploading' | 'success' | 'error' | 'unmatched';

interface FileItem {
  file: File;
  detectedPlaca: string | null;
  veiculoId: string | null;
  veiculoLabel: string | null;
  status: ItemStatus;
  error?: string;
}

/** Extrai a placa (Mercosul ABC1D23 ou antiga ABC1234) do nome de arquivo.
 *  Aceita separadores opcionais entre as 3 letras e os caracteres seguintes
 *  (hífen, espaço ou underline). Ex.: "SJS-5G90.pdf", "ABC 1234.pdf",
 *  "CRLV_TMU6H64.pdf", "TMU-6H64.pdf".
 */
function extractPlacaFromFilename(name: string): string | null {
  const upper = name.toUpperCase().replace(/\.[^.]+$/, '');
  // 1) Tenta Mercosul: 3 letras + dígito + alfanumérico + 2 dígitos.
  const mercosul = /([A-Z]{3})[-\s_]?([0-9])([A-Z0-9])([0-9]{2})/g;
  let m: RegExpExecArray | null;
  while ((m = mercosul.exec(upper)) !== null) {
    const placa = `${m[1]}${m[2]}${m[3]}${m[4]}`;
    if (/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) return placa;
  }
  // 2) Tenta formato antigo: 3 letras + 4 dígitos.
  const antigo = /([A-Z]{3})[-\s_]?([0-9]{4})/g;
  while ((m = antigo.exec(upper)) !== null) {
    return `${m[1]}${m[2]}`;
  }
  return null;
}

export function BulkDocumentUploadDialog({
  open,
  onOpenChange,
  veiculos,
  onCompleted,
}: BulkDocumentUploadDialogProps) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [tipo, setTipo] = useState<string>('crlv');
  const [running, setRunning] = useState(false);

  /** Index { placa(upper) → veículo } para casamento O(1). */
  const placaIndex = useMemo(() => {
    const map = new Map<string, FrotaVeiculo>();
    veiculos.forEach((v) => {
      if (v.placa) {
        map.set(v.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''), v);
      }
    });
    return map;
  }, [veiculos]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const newItems: FileItem[] = Array.from(fileList).map((file) => {
        const placa = extractPlacaFromFilename(file.name);
        const veiculo = placa ? placaIndex.get(placa) : undefined;
        return {
          file,
          detectedPlaca: placa,
          veiculoId: veiculo?.id ?? null,
          veiculoLabel: veiculo
            ? `${veiculo.placa} • ${veiculo.marca ?? ''} ${veiculo.modelo ?? ''}`.trim()
            : null,
          status: veiculo ? 'pending' : 'unmatched',
        };
      });
      setItems((prev) => [...prev, ...newItems]);
    },
    [placaIndex]
  );

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const reassignVeiculo = (idx: number, vehicleId: string) => {
    const veiculo = veiculos.find((v) => v.id === vehicleId);
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              veiculoId: vehicleId,
              veiculoLabel: veiculo
                ? `${veiculo.placa} • ${veiculo.marca ?? ''} ${veiculo.modelo ?? ''}`.trim()
                : null,
              status: 'pending',
            }
          : it
      )
    );
  };

  const uploadOne = async (item: FileItem, index: number) => {
    if (!item.veiculoId) return;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, status: 'uploading' } : it))
    );
    try {
      const ext = item.file.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `${item.veiculoId}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from('frotas_docs')
        .upload(filePath, item.file, { contentType: item.file.type || 'application/pdf' });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from('frotas_docs').getPublicUrl(filePath);

      const { error: dbErr } = await supabase.from('frota_documentos').insert({
        veiculo_id: item.veiculoId,
        tipo,
        nome_arquivo: item.file.name,
        url: publicUrl,
        tamanho_arquivo: item.file.size,
        tipo_mime: item.file.type || 'application/pdf',
        origem: 'upload',
      });
      if (dbErr) throw dbErr;

      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, status: 'success' } : it))
      );
    } catch (err: any) {
      console.error('Falha no upload em lote:', err);
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, status: 'error', error: err.message ?? 'Erro' } : it
        )
      );
    }
  };

  const startUpload = async () => {
    setRunning(true);
    const queue = items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => it.veiculoId && it.status !== 'success');

    // Upload com paralelismo limitado (4 por vez).
    const concurrency = 4;
    let cursor = 0;
    const workers = Array.from({ length: concurrency }).map(async () => {
      while (cursor < queue.length) {
        const current = queue[cursor++];
        await uploadOne(current.it, current.i);
      }
    });
    await Promise.all(workers);
    setRunning(false);

    const ok = items.filter((it) => it.status === 'success').length;
    const failed = items.filter((it) => it.status === 'error').length;
    toast.success(`${ok} documento(s) enviado(s)${failed ? ` • ${failed} falha(s)` : ''}`);
    window.dispatchEvent(new CustomEvent('frota-data-updated'));
    onCompleted?.();
  };

  const matched = items.filter((it) => it.veiculoId).length;
  const unmatched = items.filter((it) => !it.veiculoId).length;
  const successCount = items.filter((it) => it.status === 'success').length;

  const handleClose = (next: boolean) => {
    if (running) return;
    if (!next) {
      setItems([]);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload em lote por placa</DialogTitle>
          <DialogDescription>
            Arraste vários arquivos. O sistema detecta a placa no nome (ex:{' '}
            <code className="text-xs">CRLV_TMU6H64.pdf</code>) e anexa ao veículo certo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de documento (aplicado a todos)</Label>
              <Select value={tipo} onValueChange={setTipo} disabled={running}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoDocumentoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-files">Arquivos</Label>
              <Input
                id="bulk-files"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={running}
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.currentTarget.value = '';
                }}
              />
            </div>
          </div>

          {items.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">{items.length} arquivo(s)</Badge>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  {matched} reconhecido(s)
                </Badge>
                {unmatched > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {unmatched} sem veículo
                  </Badge>
                )}
                {successCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    {successCount} enviado(s)
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[320px] border rounded-md">
                <div className="divide-y">
                  {items.map((it, idx) => (
                    <div
                      key={`${it.file.name}-${idx}`}
                      className="flex items-center gap-3 p-3 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.detectedPlaca
                            ? `Placa detectada: ${it.detectedPlaca}`
                            : 'Placa não detectada no nome'}
                          {it.veiculoLabel && ` → ${it.veiculoLabel}`}
                        </div>
                        {it.error && (
                          <div className="text-xs text-destructive mt-0.5">{it.error}</div>
                        )}
                      </div>

                      {!it.veiculoId && (
                        <Select
                          onValueChange={(v) => reassignVeiculo(idx, v)}
                          disabled={running}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder="Atribuir veículo" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[280px]">
                            {veiculos.map((v) => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                {v.placa} — {v.marca} {v.modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="w-6 flex justify-center">
                        {it.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {it.status === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        {it.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {(it.status === 'pending' || it.status === 'unmatched') &&
                          !running && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeItem(idx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
              Fechar
            </Button>
            <Button
              onClick={startUpload}
              disabled={running || matched === 0}
              className="gap-2"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Enviar {matched} arquivo(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
