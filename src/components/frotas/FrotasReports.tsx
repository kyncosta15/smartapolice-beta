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
import { FileText, FileSpreadsheet, Filter, Search, CheckSquare, Square, Loader2, Building2, ChevronDown, ChevronRight, HardHat, LayoutGrid, Wrench, Download, X, Pencil } from 'lucide-react';
import { MAINTENANCE_TYPE_LABELS, MaintenanceType } from './maintenance/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const [generating, setGenerating] = useState<'pdf' | 'xlsx' | 'pdf-obra' | 'xlsx-obra' | 'pdf-rev' | 'xlsx-rev' | null>(null);
  const [reportMode, setReportMode] = useState<'geral' | 'obra' | 'revisoes'>('geral');

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

  // ============== POR OBRA ==============
  // Agrupa: Obra → Responsável → Veículos
  const SEM_OBRA = 'Sem obra atribuída';
  const SEM_RESP = 'Sem responsável';

  const groupByObraResponsavel = () => {
    const groups: Record<string, Record<string, FrotaVeiculo[]>> = {};
    veiculosToExport.forEach(v => {
      const obra = (v.current_worksite_name && v.current_worksite_name.trim()) || SEM_OBRA;
      const resp = (v.current_responsible_name && v.current_responsible_name.trim()) || SEM_RESP;
      if (!groups[obra]) groups[obra] = {};
      if (!groups[obra][resp]) groups[obra][resp] = [];
      groups[obra][resp].push(v);
    });
    // Ordenar: obras com nome primeiro (alfabético), "Sem obra" por último
    const sortedObras = Object.keys(groups).sort((a, b) => {
      if (a === SEM_OBRA) return 1;
      if (b === SEM_OBRA) return -1;
      return a.localeCompare(b, 'pt-BR');
    });
    return { groups, sortedObras };
  };

  // Colunas fixas para o relatório por obra (básico + data de alocação)
  const OBRA_COLUMNS: { label: string; get: (v: FrotaVeiculo) => string }[] = [
    { label: 'Placa', get: (v) => v.placa || '-' },
    { label: 'Marca', get: (v) => v.marca || '-' },
    { label: 'Modelo', get: (v) => v.modelo || '-' },
    { label: 'Ano', get: (v) => v.ano_modelo ? String(v.ano_modelo) : '-' },
    { label: 'Categoria', get: (v) => v.categoria || '-' },
    { label: 'Desde', get: (v) => formatDate(v.current_worksite_start_date) },
  ];

  const handleExportPDFObra = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }

    setGenerating('pdf-obra');
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const rawEmpresa = clienteNome || activeEmpresaName || 'Empresa';
      const empresa = rawEmpresa.replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';
      const tituloRel = reportTitle && reportTitle !== 'Relatório de Frotas'
        ? reportTitle
        : 'Relatório de Frotas por Obra';

      const drawHeader = async () => {
        // Brand bar
        doc.setFillColor(12, 21, 57);
        doc.rect(0, 0, pageWidth, 26, 'F');
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 26, pageWidth, 1.2, 'F');

        const logo = await loadImageAsDataURL(logoSrc);
        if (logo) {
          const targetH = 14;
          const ratio = logo.w / logo.h;
          const targetW = targetH * ratio;
          try { doc.addImage(logo.data, 'PNG', 8, 6, targetW, targetH); } catch {}
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(tituloRel, pageWidth / 2, 12, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 215, 240);
        const now = new Date().toLocaleString('pt-BR');
        doc.text(`Gerado em ${now}  •  ${veiculosToExport.length} veículo(s)`, pageWidth / 2, 18, { align: 'center' });

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('SmartControl', pageWidth - 8, 11, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(200, 215, 240);
        doc.text('Gestão Inteligente de Frotas', pageWidth - 8, 16, { align: 'right' });

        // Empresa bar
        doc.setFillColor(245, 247, 250);
        doc.rect(0, 27.2, pageWidth, 9, 'F');
        doc.setTextColor(80, 90, 110);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('EMPRESA', 8, 33);
        const empresaLabelWidth = doc.getTextWidth('EMPRESA');
        doc.setTextColor(12, 21, 57);
        doc.text(empresa.toUpperCase(), 8 + empresaLabelWidth + 4, 33);
      };

      await drawHeader();

      const drawFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(7);
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'normal');
          doc.text(`${empresa}  •  ${tituloRel}`, 8, pageHeight - 6);
          doc.text(`Página ${i} de ${pageCount}`, pageWidth - 8, pageHeight - 6, { align: 'right' });
        }
      };

      const { groups, sortedObras } = groupByObraResponsavel();
      const headers = OBRA_COLUMNS.map(c => c.label);

      let cursorY = 41;

      sortedObras.forEach((obra) => {
        const respGroups = groups[obra];
        const sortedResps = Object.keys(respGroups).sort((a, b) => {
          if (a === SEM_RESP) return 1;
          if (b === SEM_RESP) return -1;
          return a.localeCompare(b, 'pt-BR');
        });
        const totalVeicObra = sortedResps.reduce((acc, r) => acc + respGroups[r].length, 0);

        // Section header (Obra)
        if (cursorY + 14 > pageHeight - 15) {
          doc.addPage();
          cursorY = 41;
        }
        doc.setFillColor(12, 21, 57);
        doc.rect(6, cursorY, pageWidth - 12, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`OBRA: ${obra}`, 9, cursorY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`${totalVeicObra} veículo(s)`, pageWidth - 9, cursorY + 5.5, { align: 'right' });
        cursorY += 10;

        sortedResps.forEach((resp) => {
          const veics = respGroups[resp];

          // Sub-header (Responsável)
          if (cursorY + 8 > pageHeight - 15) {
            doc.addPage();
            cursorY = 41;
          }
          doc.setFillColor(225, 232, 245);
          doc.rect(6, cursorY, pageWidth - 12, 6.5, 'F');
          doc.setTextColor(12, 21, 57);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`Responsável: ${resp}`, 9, cursorY + 4.5);
          doc.setFont('helvetica', 'normal');
          doc.text(`${veics.length} veículo(s)`, pageWidth - 9, cursorY + 4.5, { align: 'right' });
          cursorY += 7.5;

          const rows = veics.map(v => OBRA_COLUMNS.map(c => c.get(v)));

          autoTable(doc, {
            head: [headers],
            body: rows,
            startY: cursorY,
            styles: { fontSize: 8, cellPadding: 1.8, textColor: [40, 40, 40] },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [248, 250, 253] },
            margin: { left: 6, right: 6, top: 41 },
          });

          cursorY = (doc as any).lastAutoTable.finalY + 4;
        });

        cursorY += 2;
      });

      drawFooter();

      const fileName = `relatorio_frotas_por_obra_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({ title: '✅ PDF por obra gerado', description: `${veiculosToExport.length} veículos agrupados por obra.` });
    } catch (err: any) {
      console.error('Erro ao gerar PDF por obra:', err);
      toast({ title: 'Erro ao gerar PDF', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const handleExportXLSXObra = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }

    setGenerating('xlsx-obra');
    try {
      const { groups, sortedObras } = groupByObraResponsavel();

      // Aba consolidada com coluna "Obra" e "Responsável"
      const consolidatedRows: Record<string, string>[] = [];
      sortedObras.forEach(obra => {
        const respGroups = groups[obra];
        const sortedResps = Object.keys(respGroups).sort((a, b) => {
          if (a === SEM_RESP) return 1;
          if (b === SEM_RESP) return -1;
          return a.localeCompare(b, 'pt-BR');
        });
        sortedResps.forEach(resp => {
          respGroups[resp].forEach(v => {
            const row: Record<string, string> = {
              'Obra': obra,
              'Responsável': resp,
              'Desde': formatDate(v.current_worksite_start_date),
            };
            OBRA_COLUMNS.filter(c => c.label !== 'Desde').forEach(col => {
              row[col.label] = col.get(v);
            });
            consolidatedRows.push(row);
          });
        });
      });

      const wb = XLSX.utils.book_new();

      // Aba 1: Consolidado
      const wsConsolidated = XLSX.utils.json_to_sheet(consolidatedRows);
      const consolidatedHeaders = ['Obra', 'Responsável', 'Placa', 'Marca', 'Modelo', 'Ano', 'Categoria', 'Desde'];
      wsConsolidated['!cols'] = consolidatedHeaders.map(h => {
        const maxLen = Math.max(h.length, ...consolidatedRows.map(r => (r[h] || '').length));
        return { wch: Math.min(maxLen + 2, 40) };
      });
      XLSX.utils.book_append_sheet(wb, wsConsolidated, 'Consolidado');

      // Aba 2: Resumo por obra
      const resumoRows = sortedObras.map(obra => {
        const respGroups = groups[obra];
        const totalVeic = Object.values(respGroups).reduce((acc, arr) => acc + arr.length, 0);
        const responsaveis = Object.keys(respGroups).filter(r => r !== SEM_RESP);
        return {
          'Obra': obra,
          'Veículos': totalVeic,
          'Responsáveis': responsaveis.length,
          'Lista de Responsáveis': responsaveis.join(', ') || '-',
        };
      });
      const wsResumo = XLSX.utils.json_to_sheet(resumoRows);
      wsResumo['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 14 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo por Obra');

      // Uma aba por obra (limite de 28 chars no nome)
      sortedObras.forEach(obra => {
        const respGroups = groups[obra];
        const sortedResps = Object.keys(respGroups).sort((a, b) => {
          if (a === SEM_RESP) return 1;
          if (b === SEM_RESP) return -1;
          return a.localeCompare(b, 'pt-BR');
        });
        const obraRows: Record<string, string>[] = [];
        sortedResps.forEach(resp => {
          respGroups[resp].forEach(v => {
            obraRows.push({
              'Responsável': resp,
              'Placa': v.placa || '-',
              'Marca': v.marca || '-',
              'Modelo': v.modelo || '-',
              'Ano': v.ano_modelo ? String(v.ano_modelo) : '-',
              'Categoria': v.categoria || '-',
              'Desde': formatDate(v.current_worksite_start_date),
            });
          });
        });
        const ws = XLSX.utils.json_to_sheet(obraRows);
        ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 15 }, { wch: 12 }];
        // Sanitize sheet name (Excel: max 31 chars, no : \ / ? * [ ])
        const safeName = obra.replace(/[:\\\/\?\*\[\]]/g, '-').substring(0, 28) || 'Obra';
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      });

      const fileName = `relatorio_frotas_por_obra_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({ title: '✅ Planilha por obra gerada', description: `${sortedObras.length} obra(s) exportada(s).` });
    } catch (err: any) {
      console.error('Erro ao gerar XLSX por obra:', err);
      toast({ title: 'Erro ao gerar planilha', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  // ============== REVISÕES / MANUTENÇÕES ==============
  type MaintLog = {
    id: string;
    vehicle_id: string;
    type: MaintenanceType;
    performed_date: string;
    odometer_km: number;
    cost: number;
    notes: string | null;
    realizada: boolean;
  };

  const fetchMaintenanceLogs = async (vehicleIds: string[]): Promise<Record<string, MaintLog[]>> => {
    if (vehicleIds.length === 0) return {};
    const map: Record<string, MaintLog[]> = {};
    // Chunk to avoid overly long IN clauses
    const chunkSize = 200;
    for (let i = 0; i < vehicleIds.length; i += chunkSize) {
      const chunk = vehicleIds.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('vehicle_maintenance_logs')
        .select('id, vehicle_id, type, performed_date, odometer_km, cost, notes, realizada')
        .in('vehicle_id', chunk)
        .order('performed_date', { ascending: false });
      if (error) throw error;
      (data || []).forEach((row: any) => {
        if (!map[row.vehicle_id]) map[row.vehicle_id] = [];
        map[row.vehicle_id].push(row as MaintLog);
      });
    }
    return map;
  };

  const formatMaintType = (t: string) =>
    (MAINTENANCE_TYPE_LABELS as Record<string, string>)[t] || t || '-';

  // Notes podem vir como JSON com metadata (ex.: { observacoes, itens_verificados, local_revisao,
  // proxima_revisao_data, proxima_revisao_km, _extra }). Extrai apenas texto legível.
  const formatMaintNotes = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const str = String(raw).trim();
    if (!str) return '';
    // Se não parece JSON, devolve como está
    if (!(str.startsWith('{') || str.startsWith('['))) return str;
    try {
      const obj = JSON.parse(str);
      if (!obj || typeof obj !== 'object') return str;
      const parts: string[] = [];
      const obs = (obj.observacoes ?? obj.observacao ?? '').toString().trim();
      const itens = (obj.itens_verificados ?? '').toString().trim();
      const local = (obj.local_revisao ?? obj.local ?? '').toString().trim();
      const proxData = (obj.proxima_revisao_data ?? '').toString().trim();
      const proxKm = (obj.proxima_revisao_km ?? '').toString().trim();
      if (obs) parts.push(obs);
      if (itens) parts.push(`Itens: ${itens}`);
      if (local) parts.push(`Local: ${local}`);
      if (proxData) parts.push(`Próx. revisão: ${formatDate(proxData)}`);
      if (proxKm) parts.push(`Próx. km: ${proxKm}`);
      const text = parts.join(' • ').trim();
      // Se nada legível foi extraído, retorna vazio em vez do JSON cru
      return text;
    } catch {
      return str;
    }
  };

  const handleExportPDFRevisoes = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }

    setGenerating('pdf-rev');
    try {
      const logsByVehicle = await fetchMaintenanceLogs(veiculosToExport.map(v => v.id));

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const rawEmpresa = clienteNome || activeEmpresaName || 'Empresa';
      const empresa = rawEmpresa.replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';
      const tituloRel = reportTitle && reportTitle !== 'Relatório de Frotas'
        ? reportTitle
        : 'Relatório de Revisões e Manutenções';

      // ===== Header =====
      doc.setFillColor(12, 21, 57);
      doc.rect(0, 0, pageWidth, 26, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 26, pageWidth, 1.2, 'F');

      const logo = await loadImageAsDataURL(logoSrc);
      if (logo) {
        const targetH = 14;
        const ratio = logo.w / logo.h;
        const targetW = targetH * ratio;
        try { doc.addImage(logo.data, 'PNG', 8, 6, targetW, targetH); } catch {}
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(tituloRel, pageWidth / 2, 12, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 215, 240);
      const now = new Date().toLocaleString('pt-BR');
      const totalLogs = Object.values(logsByVehicle).reduce((acc, l) => acc + l.length, 0);
      doc.text(
        `Gerado em ${now}  •  ${veiculosToExport.length} veículo(s)  •  ${totalLogs} registro(s)`,
        pageWidth / 2, 18, { align: 'center' }
      );

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SmartControl', pageWidth - 8, 11, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(200, 215, 240);
      doc.text('Gestão Inteligente de Frotas', pageWidth - 8, 16, { align: 'right' });

      // Empresa bar
      doc.setFillColor(245, 247, 250);
      doc.rect(0, 27.2, pageWidth, 9, 'F');
      doc.setTextColor(80, 90, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EMPRESA', 8, 33);
      const empresaLabelWidth = doc.getTextWidth('EMPRESA');
      doc.setTextColor(12, 21, 57);
      doc.text(empresa.toUpperCase(), 8 + empresaLabelWidth + 4, 33);

      const headers = ['Data', 'Tipo', 'KM', 'Custo', 'Realizada', 'Observações'];

      let cursorY = 41;

      // Sort vehicles: with logs first
      const sortedVeics = [...veiculosToExport].sort((a, b) => {
        const la = (logsByVehicle[a.id] || []).length;
        const lb = (logsByVehicle[b.id] || []).length;
        if (la !== lb) return lb - la;
        return (a.placa || '').localeCompare(b.placa || '', 'pt-BR');
      });

      sortedVeics.forEach((v) => {
        const logs = logsByVehicle[v.id] || [];

        // Vehicle section header
        if (cursorY + 14 > pageHeight - 15) {
          doc.addPage();
          cursorY = 41;
        }

        doc.setFillColor(12, 21, 57);
        doc.rect(6, cursorY, pageWidth - 12, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const vehTitle = `${v.placa || '-'}  •  ${[v.marca, v.modelo].filter(Boolean).join(' ') || '-'}${v.ano_modelo ? `  •  ${v.ano_modelo}` : ''}`;
        doc.text(vehTitle, 9, cursorY + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`${logs.length} registro(s)`, pageWidth - 9, cursorY + 5.5, { align: 'right' });
        cursorY += 10;

        if (logs.length === 0) {
          doc.setFillColor(248, 250, 253);
          doc.rect(6, cursorY, pageWidth - 12, 7, 'F');
          doc.setTextColor(120, 120, 120);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text('Sem revisões/manutenções registradas para este veículo.', 9, cursorY + 4.8);
          cursorY += 9;
          return;
        }

        const totalCost = logs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);

        const rows = logs.map(l => [
          formatDate(l.performed_date),
          formatMaintType(l.type),
          l.odometer_km != null ? new Intl.NumberFormat('pt-BR').format(Number(l.odometer_km)) + ' km' : '-',
          l.cost != null ? formatBRL(l.cost) : '-',
          l.realizada ? 'Sim' : 'Pendente',
          (() => { const t = formatMaintNotes(l.notes); return t ? t.slice(0, 240) : '-'; })(),
        ]);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: cursorY,
          styles: { fontSize: 8, cellPadding: 1.8, textColor: [40, 40, 40] },
          headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 250, 253] },
          columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 42 },
            2: { cellWidth: 28, halign: 'right' },
            3: { cellWidth: 28, halign: 'right' },
            4: { cellWidth: 22, halign: 'center' },
          },
          margin: { left: 6, right: 6, top: 41 },
        });

        cursorY = (doc as any).lastAutoTable.finalY + 2;

        // Total bar
        if (cursorY + 7 > pageHeight - 15) {
          doc.addPage();
          cursorY = 41;
        }
        doc.setFillColor(225, 232, 245);
        doc.rect(6, cursorY, pageWidth - 12, 6.5, 'F');
        doc.setTextColor(12, 21, 57);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`Custo total: ${formatBRL(totalCost)}`, pageWidth - 9, cursorY + 4.5, { align: 'right' });
        cursorY += 9;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.text(`${empresa}  •  ${tituloRel}`, 8, pageHeight - 6);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 8, pageHeight - 6, { align: 'right' });
      }

      const fileName = `relatorio_revisoes_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({ title: '✅ PDF de revisões gerado', description: `${totalLogs} registro(s) em ${veiculosToExport.length} veículo(s).` });
    } catch (err: any) {
      console.error('Erro ao gerar PDF de revisões:', err);
      toast({ title: 'Erro ao gerar PDF', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  const handleExportXLSXRevisoes = async () => {
    if (veiculosToExport.length === 0) {
      toast({ title: 'Nenhum veículo', description: 'Selecione ao menos um veículo.', variant: 'destructive' });
      return;
    }

    setGenerating('xlsx-rev');
    try {
      const logsByVehicle = await fetchMaintenanceLogs(veiculosToExport.map(v => v.id));

      const wb = XLSX.utils.book_new();

      // Aba 1: Consolidado (todos os logs)
      const consolidated: Record<string, string | number>[] = [];
      veiculosToExport.forEach(v => {
        const logs = logsByVehicle[v.id] || [];
        logs.forEach(l => {
          consolidated.push({
            'Placa': v.placa || '-',
            'Marca': v.marca || '-',
            'Modelo': v.modelo || '-',
            'Ano': v.ano_modelo ? String(v.ano_modelo) : '-',
            'Data': formatDate(l.performed_date),
            'Tipo': formatMaintType(l.type),
            'KM': l.odometer_km != null ? Number(l.odometer_km) : ('' as any),
            'Custo (R$)': l.cost != null ? Number(l.cost) : ('' as any),
            'Realizada': l.realizada ? 'Sim' : 'Pendente',
            'Observações': formatMaintNotes(l.notes),
          });
        });
      });

      const wsCons = XLSX.utils.json_to_sheet(consolidated);
      wsCons['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 6 },
        { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 14 },
        { wch: 12 }, { wch: 50 },
      ];
      XLSX.utils.book_append_sheet(wb, wsCons, 'Revisões');

      // Aba 2: Resumo por veículo
      const resumo = veiculosToExport.map(v => {
        const logs = logsByVehicle[v.id] || [];
        const totalCost = logs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
        const lastLog = logs[0]; // já vem ordenada desc
        return {
          'Placa': v.placa || '-',
          'Marca': v.marca || '-',
          'Modelo': v.modelo || '-',
          'Total de Registros': logs.length,
          'Custo Total (R$)': totalCost,
          'Última Manutenção': lastLog ? formatDate(lastLog.performed_date) : '-',
          'Último Tipo': lastLog ? formatMaintType(lastLog.type) : '-',
        };
      });
      const wsResumo = XLSX.utils.json_to_sheet(resumo);
      wsResumo['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo por Veículo');

      const fileName = `relatorio_revisoes_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: '✅ Planilha de revisões gerada',
        description: `${consolidated.length} registro(s) em ${veiculosToExport.length} veículo(s).`,
      });
    } catch (err: any) {
      console.error('Erro ao gerar XLSX de revisões:', err);
      toast({ title: 'Erro ao gerar planilha', description: err.message, variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  // ============== UI HELPERS ==============
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [maintenancePreviewCount, setMaintenancePreviewCount] = useState<number | null>(null);
  const [maintenancePreviewCost, setMaintenancePreviewCost] = useState<number>(0);

  // Pré-carrega contagem/custo de manutenções para o painel de prévia (somente no modo revisões)
  useEffect(() => {
    let cancelled = false;
    if (reportMode !== 'revisoes' || veiculosToExport.length === 0) {
      setMaintenancePreviewCount(null);
      setMaintenancePreviewCost(0);
      return;
    }
    const ids = veiculosToExport.map(v => v.id);
    (async () => {
      try {
        const map = await fetchMaintenanceLogs(ids);
        if (cancelled) return;
        const all = Object.values(map).flat();
        setMaintenancePreviewCount(all.length);
        setMaintenancePreviewCost(all.reduce((acc, l) => acc + (Number(l.cost) || 0), 0));
      } catch {
        if (!cancelled) {
          setMaintenancePreviewCount(0);
          setMaintenancePreviewCost(0);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportMode, veiculosToExport.map(v => v.id).join(',')]);

  const totalVeiculos = veiculosToExport.length;
  const totalRegistros = reportMode === 'revisoes'
    ? (maintenancePreviewCount ?? 0)
    : veiculosToExport.length;
  const custoEstimado = reportMode === 'revisoes'
    ? maintenancePreviewCost
    : veiculosToExport.reduce((acc, v) => acc + (Number(v.preco_fipe) || 0), 0);

  // Métricas específicas para o modo "Por Obra"
  const obraStats = useMemo(() => {
    if (reportMode !== 'obra') return { totalObras: 0, alocados: 0, semObra: 0 };
    const obras = new Set<string>();
    let alocados = 0;
    let semObra = 0;
    veiculosToExport.forEach(v => {
      const nome = (v.current_worksite_name || '').trim();
      if (nome) {
        obras.add(nome.toLowerCase());
        alocados++;
      } else {
        semObra++;
      }
    });
    return { totalObras: obras.size, alocados, semObra };
  }, [reportMode, veiculosToExport]);

  const activeFilters: { key: string; label: string; clear: () => void }[] = [];
  if (search) activeFilters.push({ key: 'search', label: `Busca: ${search}`, clear: () => setSearch('') });
  if (filterCategoria !== 'all') activeFilters.push({ key: 'cat', label: `Categoria: ${filterCategoria}`, clear: () => setFilterCategoria('all') });
  if (filterStatus !== 'all') activeFilters.push({ key: 'st', label: `Status: ${formatStatusSeguro(filterStatus)}`, clear: () => setFilterStatus('all') });
  if (filterMarca !== 'all') activeFilters.push({ key: 'mc', label: `Marca: ${filterMarca}`, clear: () => { setFilterMarca('all'); setFilterModelo('all'); } });
  if (filterModelo !== 'all') activeFilters.push({ key: 'mo', label: `Modelo: ${filterModelo}`, clear: () => setFilterModelo('all') });

  const clearAllFilters = () => {
    setSearch('');
    setFilterCategoria('all');
    setFilterStatus('all');
    setFilterMarca('all');
    setFilterModelo('all');
  };

  // CTA wiring por modo
  const isGenerating = generating !== null;
  const ctas = (() => {
    if (reportMode === 'obra') {
      return {
        pdf: { onClick: handleExportPDFObra, loading: generating === 'pdf-obra' },
        xlsx: { onClick: handleExportXLSXObra, loading: generating === 'xlsx-obra' },
      };
    }
    if (reportMode === 'revisoes') {
      return {
        pdf: { onClick: handleExportPDFRevisoes, loading: generating === 'pdf-rev' },
        xlsx: { onClick: handleExportXLSXRevisoes, loading: generating === 'xlsx-rev' },
      };
    }
    return {
      pdf: { onClick: handleExportPDF, loading: generating === 'pdf' },
      xlsx: { onClick: handleExportXLSX, loading: generating === 'xlsx' },
    };
  })();

  const modeDescription =
    reportMode === 'geral' ? 'Configure filtros e colunas para exportar.' :
    reportMode === 'obra' ? 'Veículos agrupados por obra (canteiro) e por responsável.' :
    'Lista revisões e manutenções por veículo com data, tipo, KM, custo e observações.';

  const canExport = !isGenerating && filteredVeiculos.length > 0;

  return (
    <div className="bg-background -mx-3 -my-3 sm:-mx-4 md:-mx-6 sm:-my-4 md:-my-6">
      {/* ===== Sticky top bar: breadcrumb + CTAs ===== */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={ctas.pdf.onClick}
              disabled={!canExport}
              className="gap-2 h-9"
            >
              {ctas.pdf.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </Button>
            <Button
              size="sm"
              onClick={ctas.xlsx.onClick}
              disabled={!canExport}
              className="gap-2 h-9"
            >
              {ctas.xlsx.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Gerar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Page body ===== */}
      <div className="px-4 sm:px-6 py-6">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl font-medium text-foreground tracking-tight">
              Gerar Relatório de Frotas
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {modeDescription}
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
          {/* ===== LEFT: form ===== */}
          <div className="space-y-6 min-w-0">
            {/* Title */}
            <div>
              <Label htmlFor="report-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Título
              </Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                placeholder="Relatório de Frotas"
                className="mt-2 h-10 bg-surface-1 border-border"
              />
            </div>

            {/* Mode (segmented control) */}
            <div>
              <Label className="block mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Modo
              </Label>
              <div
                role="tablist"
                aria-label="Modo do relatório"
                className="mt-2 inline-flex p-1 rounded-xl bg-surface-2/60 border border-border"
              >
                {([
                  { key: 'geral', label: 'Visão Geral' },
                  { key: 'obra', label: 'Por Obra' },
                  { key: 'revisoes', label: 'Revisões / Manutenções' },
                ] as const).map(({ key, label }) => {
                  const active = reportMode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setReportMode(key)}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-muted-foreground mt-2">
                {modeDescription}
              </p>
            </div>

            {/* Filters */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Filtros
                  </Label>
                  {activeFilters.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-primary-bg text-foreground border border-primary-border">
                      {activeFilters.length} {activeFilters.length === 1 ? 'ativo' : 'ativos'}
                    </span>
                  )}
                </div>
                {activeFilters.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Placa ou marca"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-10 bg-surface-1 border-border text-[13px]"
                  />
                </div>

                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="h-10 bg-surface-1 border-border text-[13px]">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categorias.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 bg-surface-1 border-border text-[13px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>{formatStatusSeguro(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterMarca}
                  onValueChange={(v) => { setFilterMarca(v); setFilterModelo('all'); }}
                >
                  <SelectTrigger className="h-10 bg-surface-1 border-border text-[13px]">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {marcas.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterModelo} onValueChange={setFilterModelo}>
                  <SelectTrigger className="h-10 bg-surface-1 border-border text-[13px] sm:col-span-2">
                    <SelectValue placeholder="Modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os modelos</SelectItem>
                    {modelos.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Columns (pills) */}
            {reportMode === 'geral' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Colunas
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedColumns.size} {selectedColumns.size === 1 ? 'selecionada' : 'selecionadas'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColumnsModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[12px] text-primary hover:opacity-80 transition-opacity"
                  >
                    Editar <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_COLUMNS.filter(c => selectedColumns.has(String(c.key))).map(col => (
                    <button
                      key={String(col.key)}
                      type="button"
                      onClick={() => toggleColumn(String(col.key))}
                      className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 hover:bg-primary-bg border border-border hover:border-primary-border text-[12px] text-foreground transition-colors"
                      title="Clique para remover"
                    >
                      {col.label}
                      <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  ))}
                  {selectedColumns.size === 0 && (
                    <span className="text-[12px] text-muted-foreground italic">Nenhuma coluna selecionada — abra "Editar" para escolher.</span>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle selection (collapsible-ish list) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Veículos
                </Label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {selectedIds.size === 0
                      ? `Todos os ${filteredVeiculos.length} filtrados`
                      : `${selectedIds.size} selecionados`}
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={filteredVeiculos.length === 0}
                    className="text-[12px] text-primary hover:opacity-80 disabled:opacity-40 transition-opacity"
                  >
                    {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
                <ScrollArea className="h-56">
                  <div className="p-1">
                    {loading ? (
                      <div className="text-center py-8 text-[13px] text-muted-foreground">Carregando veículos…</div>
                    ) : filteredVeiculos.length === 0 ? (
                      <div className="text-center py-8 text-[13px] text-muted-foreground">Nenhum veículo encontrado.</div>
                    ) : (
                      filteredVeiculos.map(v => (
                        <label
                          key={v.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-2 cursor-pointer text-[13px] transition-colors"
                        >
                          <Checkbox
                            checked={selectedIds.has(v.id)}
                            onCheckedChange={() => toggleSelectOne(v.id)}
                          />
                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                            <span className="font-mono font-medium text-foreground">{v.placa || '-'}</span>
                            <span className="text-muted-foreground truncate">{v.marca} {v.modelo}</span>
                            <span className="text-[11px] text-muted-foreground">{v.categoria || '-'}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Deixe vazio para incluir todos os veículos filtrados.
              </p>
            </div>
          </div>

          {/* ===== RIGHT: preview panel (sticky) ===== */}
          <aside className="lg:sticky lg:top-[72px] space-y-3">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Preview header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prévia</span>
                <span className="text-[11px] text-muted-foreground">atualizado agora</span>
              </div>

              {/* Skeleton-like preview of the report layout */}
              <div className="p-4">
                <div className="rounded-lg bg-surface-2 border border-border p-4">
                  <div className="text-[12px] font-semibold text-foreground mb-3 truncate">
                    {reportTitle || 'Relatório de Frotas'}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="h-2 rounded-sm bg-muted flex-1" />
                      <div className="h-2 rounded-sm bg-muted flex-1" />
                      <div className="h-2 rounded-sm bg-muted flex-1" />
                      <div className="h-2 rounded-sm bg-muted flex-1" />
                    </div>
                    <div className="flex gap-1.5 opacity-70">
                      <div className="h-2 rounded-sm bg-muted/70 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/70 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/70 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/70 flex-1" />
                    </div>
                    <div className="flex gap-1.5 opacity-50">
                      <div className="h-2 rounded-sm bg-muted/50 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/50 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/50 flex-1" />
                      <div className="h-2 rounded-sm bg-muted/50 flex-1" />
                    </div>
                  </div>
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {reportMode === 'obra' ? (
                    <>
                      <div className="rounded-lg border border-border bg-surface-1 p-3">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Obras</div>
                        <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{obraStats.totalObras}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-1 p-3">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Alocados</div>
                        <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{obraStats.alocados}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border border-border bg-surface-1 p-3">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Veículos</div>
                        <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{totalVeiculos}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-1 p-3">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Registros</div>
                        <div className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
                          {reportMode === 'revisoes' && maintenancePreviewCount === null
                            ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            : totalRegistros}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {reportMode === 'obra' ? (
                  <div className="rounded-lg border border-border bg-surface-1 p-3 mt-3 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-muted-foreground">Sem obra</span>
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">
                      {obraStats.semObra}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-surface-1 p-3 mt-3 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-muted-foreground">
                      {reportMode === 'revisoes' ? 'Custo total' : 'Soma FIPE'}
                    </span>
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">
                      {formatBRL(custoEstimado)}
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-3 h-9 text-[13px]"
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={!canExport}
                >
                  Visualizar completo
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Filtros ativos
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeFilters.map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={f.clear}
                      className="group inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-bg border border-primary-border text-[11px] text-foreground hover:bg-primary-bg-strong transition-colors"
                    >
                      {f.label}
                      <X className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ===== Columns edit modal ===== */}
      {columnsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setColumnsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Editar colunas</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Selecione as colunas que aparecerão no relatório.</p>
              </div>
              <button
                type="button"
                onClick={() => setColumnsModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {ALL_COLUMNS.map(col => (
                  <label
                    key={String(col.key)}
                    className="flex items-center gap-2 cursor-pointer text-[13px] hover:bg-surface-2 rounded-md px-2.5 py-2 transition-colors"
                  >
                    <Checkbox
                      checked={selectedColumns.has(String(col.key))}
                      onCheckedChange={() => toggleColumn(String(col.key))}
                    />
                    <span className="text-foreground">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-surface-1">
              <span className="text-[12px] text-muted-foreground">
                {selectedColumns.size} {selectedColumns.size === 1 ? 'coluna selecionada' : 'colunas selecionadas'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedColumns(new Set(ALL_COLUMNS.filter(c => c.default).map(c => String(c.key))))}
                >
                  Padrão
                </Button>
                <Button size="sm" onClick={() => setColumnsModalOpen(false)}>
                  Pronto
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Preview modal (read-only sample) ===== */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{reportTitle || 'Relatório de Frotas'}</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Prévia • {totalVeiculos} {totalVeiculos === 1 ? 'veículo' : 'veículos'}
                  {' · '}
                  {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {reportMode === 'geral' ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-surface-2">
                        {columnsToExport.map(c => (
                          <th key={String(c.key)} className="text-left px-3 py-2 font-semibold text-foreground border-b border-border">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {veiculosToExport.slice(0, 30).map((v, idx) => (
                        <tr key={v.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-surface-1'}>
                          {columnsToExport.map(c => {
                            const raw = (v as any)[c.key];
                            const val = c.format ? c.format(raw, v) : (raw == null || raw === '' ? '-' : String(raw));
                            return (
                              <td key={String(c.key)} className="px-3 py-2 text-foreground border-b border-border/50">{val}</td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {veiculosToExport.length > 30 && (
                    <div className="text-center py-2 text-[11px] text-muted-foreground bg-surface-1">
                      … e mais {veiculosToExport.length - 30} linha(s) no arquivo final
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[13px] text-muted-foreground">
                  Prévia tabular não disponível neste modo. Gere o PDF ou Excel para visualizar o resultado completo.
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-1">
              <Button variant="outline" size="sm" onClick={ctas.pdf.onClick} disabled={!canExport} className="gap-2">
                {ctas.pdf.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                PDF
              </Button>
              <Button size="sm" onClick={ctas.xlsx.onClick} disabled={!canExport} className="gap-2">
                {ctas.xlsx.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Gerar Excel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
