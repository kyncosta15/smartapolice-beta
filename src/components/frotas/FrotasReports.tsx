import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, FileSpreadsheet, Filter, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { useTenant } from '@/contexts/TenantContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoSrc from '@/assets/smartcontrol-logo-shield.png';

async function loadImageAsDataURL(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = dataUrl;
    });
    return { data: dataUrl, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

interface FrotasReportsProps {
  veiculos: FrotaVeiculo[];
  loading: boolean;
}

interface ReportColumn {
  key: keyof FrotaVeiculo | string;
  label: string;
  default: boolean;
  format?: (v: any, row?: FrotaVeiculo) => string;
}

const ALL_COLUMNS: ReportColumn[] = [
  { key: 'placa', label: 'Placa', default: true },
  { key: 'marca', label: 'Marca', default: true },
  { key: 'modelo', label: 'Modelo', default: true },
  { key: 'ano_modelo', label: 'Ano', default: true },
  { key: 'categoria', label: 'Categoria', default: true },
  { key: 'status_seguro', label: 'Status Seguro', default: true, format: (v) => formatStatusSeguro(v) },
  { key: 'combustivel', label: 'Combustível', default: false },
  { key: 'chassi', label: 'Chassi', default: false },
  { key: 'renavam', label: 'Renavam', default: false },
  { key: 'codigo_fipe', label: 'Código FIPE', default: false },
  { key: 'preco_fipe', label: 'Preço FIPE', default: true, format: (v) => formatBRL(v) },
  { key: 'preco_nf', label: 'Preço NF', default: false, format: (v) => formatBRL(v) },
  { key: 'proprietario_nome', label: 'Proprietário', default: false },
  { key: 'proprietario_doc', label: 'Doc. Proprietário', default: false },
  { key: 'uf_emplacamento', label: 'UF', default: false },
  { key: 'data_venc_emplacamento', label: 'Venc. Emplacamento', default: false, format: (v) => formatDate(v) },
  { key: 'modalidade_compra', label: 'Modalidade', default: false },
  { key: 'localizacao', label: 'Localização', default: false },
  { key: 'current_responsible_name', label: 'Responsável', default: false },
  { key: 'current_worksite_name', label: 'Obra', default: false },
];

function formatBRL(v: any): string {
  if (v == null || v === '') return '-';
  const num = Number(v);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function formatDate(v: any): string {
  if (!v) return '-';
  try {
    const [y, m, d] = String(v).split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return String(v);
  }
}

function formatStatusSeguro(v: any): string {
  const map: Record<string, string> = {
    'segurado': 'Segurado',
    'com_seguro': 'Segurado',
    'sem_seguro': 'Sem Seguro',
    'pendente': 'Pendente',
  };
  return map[v] || v || '-';
}

export function FrotasReports({ veiculos, loading }: FrotasReportsProps) {
  const { toast } = useToast();
  const { activeEmpresaName } = useTenant();
  const [clienteNome, setClienteNome] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.name) setClienteNome(data.name);
    })();
  }, []);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMarca, setFilterMarca] = useState<string>('all');
  const [filterModelo, setFilterModelo] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter(c => c.default).map(c => String(c.key)))
  );
  const [reportTitle, setReportTitle] = useState('Relatório de Frotas');
  const [generating, setGenerating] = useState<'pdf' | 'xlsx' | null>(null);

  const categorias = useMemo(() => {
    return Array.from(new Set(veiculos.map(v => v.categoria).filter(Boolean))) as string[];
  }, [veiculos]);

  const marcas = useMemo(() => {
    return Array.from(new Set(veiculos.map(v => v.marca).filter(Boolean))) as string[];
  }, [veiculos]);

  const modelos = useMemo(() => {
    const source = filterMarca !== 'all'
      ? veiculos.filter(v => v.marca === filterMarca)
      : veiculos;
    return Array.from(new Set(source.map(v => v.modelo).filter(Boolean))).sort() as string[];
  }, [veiculos, filterMarca]);

  const statuses = useMemo(() => {
    return Array.from(new Set(veiculos.map(v => v.status_seguro).filter(Boolean))) as string[];
  }, [veiculos]);

  const filteredVeiculos = useMemo(() => {
    return veiculos.filter(v => {
      if (search) {
        const term = search.toLowerCase();
        const match =
          (v.placa || '').toLowerCase().includes(term) ||
          (v.marca || '').toLowerCase().includes(term) ||
          (v.modelo || '').toLowerCase().includes(term) ||
          (v.proprietario_nome || '').toLowerCase().includes(term);
        if (!match) return false;
      }
      if (filterCategoria !== 'all' && v.categoria !== filterCategoria) return false;
      if (filterStatus !== 'all' && v.status_seguro !== filterStatus) return false;
      if (filterMarca !== 'all' && v.marca !== filterMarca) return false;
      if (filterModelo !== 'all' && v.modelo !== filterModelo) return false;
      return true;
    });
  }, [veiculos, search, filterCategoria, filterStatus, filterMarca, filterModelo]);

  const allFilteredSelected = filteredVeiculos.length > 0 && filteredVeiculos.every(v => selectedIds.has(v.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      filteredVeiculos.forEach(v => next.delete(v.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredVeiculos.forEach(v => next.add(v.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleColumn = (key: string) => {
    const next = new Set(selectedColumns);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedColumns(next);
  };

  const veiculosToExport = useMemo(() => {
    if (selectedIds.size === 0) return filteredVeiculos;
    return filteredVeiculos.filter(v => selectedIds.has(v.id));
  }, [filteredVeiculos, selectedIds]);

  const columnsToExport = useMemo(() => {
    return ALL_COLUMNS.filter(c => selectedColumns.has(String(c.key)));
  }, [selectedColumns]);

  const buildRows = () => {
    return veiculosToExport.map(v => {
      const row: Record<string, string> = {};
      columnsToExport.forEach(col => {
        const raw = (v as any)[col.key];
        row[col.label] = col.format ? col.format(raw, v) : (raw == null || raw === '' ? '-' : String(raw));
      });
      return row;
    });
  };

  const handleExportPDF = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }
    if (columnsToExport.length === 0) {
      toast({ title: 'Nenhuma coluna', description: 'Selecione ao menos uma coluna.', variant: 'destructive' });
      return;
    }

    setGenerating('pdf');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ========== MODERN HEADER ==========
      const rawEmpresa = clienteNome || activeEmpresaName || 'Empresa';
      // Se o nome vier como "Cliente - email@x.com", limpa o prefixo
      const empresa = rawEmpresa.replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';

      // Brand bar (Prussian Blue)
      doc.setFillColor(12, 21, 57);
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Accent stripe
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 26, pageWidth, 1.2, 'F');

      // Logo (left)
      const logo = await loadImageAsDataURL(logoSrc);
      if (logo) {
        const targetH = 14;
        const ratio = logo.w / logo.h;
        const targetW = targetH * ratio;
        try {
          doc.addImage(logo.data, 'PNG', 8, 6, targetW, targetH);
        } catch {}
      }

      // Title (center)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(reportTitle, pageWidth / 2, 12, { align: 'center' });

      // Date/total meta (center, smaller)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 215, 240);
      const now = new Date().toLocaleString('pt-BR');
      doc.text(`Gerado em ${now}  •  ${veiculosToExport.length} veículo(s)`, pageWidth / 2, 18, { align: 'center' });

      // System brand (right)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SmartControl', pageWidth - 8, 11, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(200, 215, 240);
      doc.text('Gestão Inteligente de Frotas', pageWidth - 8, 16, { align: 'right' });

      // ========== COMPANY BAR (light, prominent) ==========
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 27.2, pageWidth, 9, 'F');
      doc.setTextColor(80, 90, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EMPRESA', 8, 33);
      const empresaLabelWidth = doc.getTextWidth('EMPRESA');
      doc.setTextColor(12, 21, 57);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(empresa.toUpperCase(), 8 + empresaLabelWidth + 4, 33);


      const headers = columnsToExport.map(c => c.label);
      const rows = buildRows().map(r => headers.map(h => r[h]));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 41,
        styles: { fontSize: 7, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: { fillColor: [12, 21, 57], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 6, right: 6, top: 41 },
        didDrawPage: (data) => {
          // Footer on every page
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `${empresa}  •  Relatório de Frotas`,
            8,
            pageHeight - 6
          );
          doc.text(
            `Página ${currentPage} de ${pageCount}`,
            pageWidth - 8,
            pageHeight - 6,
            { align: 'right' }
          );
        },
      });

      const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({ title: '✅ PDF gerado', description: `${veiculosToExport.length} veículos exportados.` });
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      toast({ title: 'Erro ao gerar PDF', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const handleExportXLSX = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }
    if (columnsToExport.length === 0) {
      toast({ title: 'Nenhuma coluna', description: 'Selecione ao menos uma coluna.', variant: 'destructive' });
      return;
    }

    setGenerating('xlsx');
    try {
      const rows = buildRows();
      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto column widths
      const headers = columnsToExport.map(c => c.label);
      const colWidths = headers.map(h => {
        const maxLen = Math.max(
          h.length,
          ...rows.map(r => (r[h] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 40) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Frotas');

      const fileName = `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({ title: '✅ Planilha gerada', description: `${veiculosToExport.length} veículos exportados.` });
    } catch (err: any) {
      console.error('Erro ao gerar XLSX:', err);
      toast({ title: 'Erro ao gerar planilha', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Relatório de Frotas
          </CardTitle>
          <CardDescription>
            Selecione filtros, veículos e colunas para gerar relatórios em PDF ou planilha Excel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="report-title">Título do relatório</Label>
            <Input
              id="report-title"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              placeholder="Relatório de Frotas"
              className="mt-1.5"
            />
          </div>

          <Separator />

          {/* Filters */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              Filtros
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar placa, marca, modelo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status seguro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s}>{formatStatusSeguro(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMarca} onValueChange={setFilterMarca}>
                <SelectTrigger>
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {marcas.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Columns */}
          <div>
            <Label className="mb-3 block">
              Colunas do relatório
              <Badge variant="secondary" className="ml-2">{selectedColumns.size} selecionadas</Badge>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 border rounded-lg bg-muted/30">
              {ALL_COLUMNS.map(col => (
                <label
                  key={String(col.key)}
                  className="flex items-center gap-2 cursor-pointer text-sm hover:bg-background rounded px-2 py-1"
                >
                  <Checkbox
                    checked={selectedColumns.has(String(col.key))}
                    onCheckedChange={() => toggleColumn(String(col.key))}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Vehicle selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>
                Veículos
                <Badge variant="secondary" className="ml-2">
                  {selectedIds.size === 0 ? `Todos os ${filteredVeiculos.length} filtrados` : `${selectedIds.size} selecionados`}
                </Badge>
              </Label>
              <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={filteredVeiculos.length === 0}>
                {allFilteredSelected ? <CheckSquare className="h-4 w-4 mr-1" /> : <Square className="h-4 w-4 mr-1" />}
                {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos filtrados'}
              </Button>
            </div>

            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Carregando veículos...</div>
                ) : filteredVeiculos.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Nenhum veículo encontrado.</div>
                ) : (
                  filteredVeiculos.map(v => (
                    <label
                      key={v.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedIds.has(v.id)}
                        onCheckedChange={() => toggleSelectOne(v.id)}
                      />
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                        <span className="font-mono font-medium">{v.placa || '-'}</span>
                        <span className="text-muted-foreground truncate">{v.marca} {v.modelo}</span>
                        <span className="text-xs text-muted-foreground">{v.categoria || '-'}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground mt-2">
              Dica: deixe vazio para incluir todos os veículos filtrados no relatório.
            </p>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleExportXLSX}
              disabled={generating !== null || filteredVeiculos.length === 0}
              className="gap-2"
            >
              {generating === 'xlsx' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Gerar Planilha (XLSX)
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={generating !== null || filteredVeiculos.length === 0}
              className="gap-2"
            >
              {generating === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
