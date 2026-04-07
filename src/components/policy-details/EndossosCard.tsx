import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Loader2, FilePlus, Pencil, Check, X, ChevronDown, FileText, Calendar, DollarSign } from 'lucide-react';
import { EndossoParcelasSection } from './EndossoParcelasSection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/currencyFormatter';

interface PolicyDocument {
  id: string;
  tipo: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho_bytes: number | null;
  created_at: string;
  valor: number | null;
}

interface EndossosCardProps {
  policyId: string;
  onEndossosChange?: (totalEndossos: number) => void;
}

export function EndossosCard({ policyId, onEndossosChange }: EndossosCardProps) {
  const { toast } = useToast();
  const [endossos, setEndossos] = useState<PolicyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadEndossos();
  }, [policyId]);

  useEffect(() => {
    if (onEndossosChange) {
      const total = endossos.reduce((sum, e) => sum + (e.valor || 0), 0);
      onEndossosChange(total);
    }
  }, [endossos, onEndossosChange]);

  const loadEndossos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('policy_documents')
        .select('*')
        .eq('policy_id', policyId)
        .eq('tipo', 'endosso')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndossos(data || []);
    } catch (error) {
      console.error('Erro ao carregar endossos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: PolicyDocument) => {
    setDownloadingId(doc.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ pdfPath: doc.storage_path }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no download');
      }
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const filename = doc.nome_arquivo || `endosso.pdf`;
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      toast({ title: "✅ Download concluído", description: `${filename} baixado com sucesso` });
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast({ title: "❌ Erro no Download", description: error.message || "Não foi possível obter o arquivo", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const startEditing = (doc: PolicyDocument) => {
    setEditingId(doc.id);
    setEditValue(doc.valor?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveValue = async (docId: string) => {
    setSavingId(docId);
    try {
      const valorNumerico = parseFloat(editValue.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      const { error } = await (supabase as any)
        .from('policy_documents')
        .update({ valor: valorNumerico })
        .eq('id', docId);
      if (error) throw error;
      setEndossos(prev => prev.map(e => e.id === docId ? { ...e, valor: valorNumerico } : e));
      toast({ title: "✅ Valor salvo", description: `Valor do endosso atualizado para ${formatCurrency(valorNumerico)}` });
      setEditingId(null);
      setEditValue('');
    } catch (error: any) {
      toast({ title: "❌ Erro", description: error.message || "Não foi possível salvar o valor", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totalEndossos = endossos.reduce((sum, e) => sum + (e.valor || 0), 0);

  if (!isLoading && endossos.length === 0) return null;

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3 pt-4 px-5 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <FilePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span>Endossos</span>
              <span className="text-muted-foreground font-normal ml-1.5">({endossos.length})</span>
            </div>
          </CardTitle>
          {totalEndossos > 0 && (
            <Badge variant="secondary" className="text-xs font-semibold bg-primary/8 text-primary border-0 px-3 py-1">
              {formatCurrency(totalEndossos)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {endossos.map((doc, index) => {
              const num = endossos.length - index;
              const isOpen = openItems[doc.id] ?? false;

              return (
                <div key={doc.id} className="group">
                  {/* Header do endosso */}
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleItem(doc.id)}>
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/8 text-primary font-bold text-sm shrink-0">
                      {num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">
                          Endosso Nº {num}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {doc.nome_arquivo}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.valor ? (
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(doc.valor)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sem valor</span>
                      )}
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Conteúdo expandido */}
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 bg-muted/10">
                      <div className="ml-[52px] space-y-3">
                        {/* Ações: valor + download */}
                        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-background border border-border">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {editingId === doc.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">R$</span>
                                <Input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  placeholder="0,00"
                                  className="h-7 text-sm w-28"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); saveValue(doc.id); }} disabled={savingId === doc.id} className="h-7 w-7 p-0 text-green-600 hover:bg-green-500/10">
                                  {savingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); cancelEditing(); }} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground font-medium">
                                  {doc.valor ? formatCurrency(doc.valor) : 'Não informado'}
                                </span>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEditing(doc); }} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted">
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                            disabled={downloadingId === doc.id}
                            className="h-8 px-3 text-xs gap-1.5 shrink-0"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Baixar PDF
                          </Button>
                        </div>

                        {/* Parcelas */}
                        <EndossoParcelasSection endossoId={doc.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
