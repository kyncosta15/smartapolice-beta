import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Crown,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Building2,
} from 'lucide-react';
import {
  useConsultoriaCaso,
  useConsultoriaDocumentos,
  useUploadDocumento,
  useDeleteDocumento,
  useConsultoriaPareceres,
  useGerarParecer,
  STATUS_LABELS,
  TIPO_CASO_LABELS,
} from '@/hooks/useConsultoria';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConsultoriaCasoDetailPage() {
  const { casoId } = useParams<{ casoId: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipoUpload, setTipoUpload] = useState('apolice');

  const { data: caso, isLoading } = useConsultoriaCaso(casoId);
  const { data: documentos = [] } = useConsultoriaDocumentos(casoId);
  const { data: pareceres = [] } = useConsultoriaPareceres(casoId);
  const upload = useUploadDocumento();
  const remove = useDeleteDocumento();
  const gerar = useGerarParecer();

  const handleFiles = async (files: FileList | null) => {
    if (!files || !casoId || !caso?.empresa_id) return;
    const arr = Array.from(files);
    if (arr.length > 10) {
      toast.error('Máximo 10 arquivos por vez', { position: 'top-right' });
      return;
    }
    for (const file of arr) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} excede 20MB`, { position: 'top-right' });
        continue;
      }
      await upload.mutateAsync({
        casoId,
        empresaId: caso.empresa_id,
        file,
        tipoDocumento: tipoUpload,
      });
    }
    toast.success('Upload concluído', { position: 'top-right' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground">Caso não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/consultoria-premium')}>
          Voltar para a lista
        </Button>
      </div>
    );
  }

  const status = STATUS_LABELS[caso.status] ?? STATUS_LABELS.rascunho;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/consultoria-premium')}>
            <ArrowLeft className="size-4" />
          </Button>
          <Crown className="size-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">{caso.titulo}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={`${status.color} border-0`}>{status.label}</Badge>
              <span className="text-xs text-muted-foreground">
                {TIPO_CASO_LABELS[caso.tipo_caso] ?? caso.tipo_caso}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Resumo */}
        <Card className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Layout</div>
              <div className="font-medium capitalize">{caso.modo_layout}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Revisão</div>
              <div className="font-medium">
                {caso.revisao_obrigatoria ? 'Obrigatória' : 'Opcional'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">CNPJs</div>
              <div className="font-medium">{caso.cnpjs?.length ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Documentos</div>
              <div className="font-medium">{documentos.length}</div>
            </div>
          </div>
          {caso.cnpjs && caso.cnpjs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-1.5">
              {caso.cnpjs.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1">
                  <Building2 className="size-3" /> {c}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Upload */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-base">Documentos do caso</h2>
              <p className="text-xs text-muted-foreground">
                PDFs até 20MB. Máximo 10 arquivos por vez.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={tipoUpload} onValueChange={setTipoUpload}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apolice">Apólice</SelectItem>
                  <SelectItem value="consorcio">Consórcio</SelectItem>
                  <SelectItem value="financiamento">Financiamento</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={upload.isPending}
                size="sm"
              >
                <Upload className="size-4 mr-2" />
                {upload.isPending ? 'Enviando...' : 'Enviar PDFs'}
              </Button>
            </div>
          </div>

          {documentos.length === 0 ? (
            <div
              className="border border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="size-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique aqui ou arraste PDFs para enviar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{doc.nome_original}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.tipo_documento} ·{' '}
                        {doc.tamanho_bytes
                          ? `${(doc.tamanho_bytes / 1024 / 1024).toFixed(2)} MB`
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      remove.mutate({
                        id: doc.id,
                        storage_path: doc.storage_path,
                        caso_id: doc.caso_id,
                      })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* IA - geração de parecer */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Geração do parecer pela IA</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A IA lerá cada PDF anexo, identificará as lacunas com base nos critérios da
                consultoria e gerará um parecer no padrão Rcaldas. Pode levar 30–90 segundos.
              </p>
              <Button
                onClick={() => casoId && gerar.mutate(casoId)}
                disabled={gerar.isPending || documentos.length === 0}
              >
                <Sparkles className="size-4 mr-2" />
                {gerar.isPending
                  ? 'Analisando documentos...'
                  : pareceres.length > 0
                  ? 'Gerar nova versão'
                  : 'Gerar parecer'}
              </Button>
              {documentos.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Envie ao menos 1 PDF para liberar a geração.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Pareceres existentes */}
        {pareceres.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-base mb-3">Pareceres gerados</h3>
            <div className="space-y-2">
              {pareceres.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/consultoria-premium/parecer/${p.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-medium">Versão {p.versao}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {p.ia_modelo}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {p.status.replace('_', ' ')}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
