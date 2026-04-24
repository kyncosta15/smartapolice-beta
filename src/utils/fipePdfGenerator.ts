import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import logoSrc from '@/assets/smartcontrol-logo-shield.png';

interface FipePDFData {
  veiculos: FrotaVeiculo[];
  stats: {
    totalFipeValue: number;
    carros: { valor: number; count: number };
    caminhoes: { valor: number; count: number };
    motos: { valor: number; count: number };
    outros: { valor: number; count: number };
  };
  proprietario?: string;
  empresa?: string;
}

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

export class FipePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 8;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private formatCurrency(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private async addHeader(empresa: string, proprietario?: string) {
    // Brand bar (Prussian Blue)
    this.doc.setFillColor(12, 21, 57);
    this.doc.rect(0, 0, this.pageWidth, 26, 'F');

    // Accent stripe
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(0, 26, this.pageWidth, 1.2, 'F');

    // Logo (left)
    const logo = await loadImageAsDataURL(logoSrc);
    if (logo) {
      const targetH = 14;
      const ratio = logo.w / logo.h;
      const targetW = targetH * ratio;
      try {
        this.doc.addImage(logo.data, 'PNG', 8, 6, targetW, targetH);
      } catch {}
    }

    // Title (center)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.text('Relatório FIPE - Gestão de Frotas', this.pageWidth / 2, 12, { align: 'center' });

    // Date meta (center, smaller)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(200, 215, 240);
    const now = new Date().toLocaleString('pt-BR');
    const metaText = proprietario
      ? `Gerado em ${now}  •  Proprietário: ${proprietario}`
      : `Gerado em ${now}`;
    this.doc.text(metaText, this.pageWidth / 2, 18, { align: 'center' });

    // System brand (right)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('SmartControl', this.pageWidth - 8, 11, { align: 'right' });
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(200, 215, 240);
    this.doc.text('Gestão Inteligente de Frotas', this.pageWidth - 8, 16, { align: 'right' });

    // ========== COMPANY BAR (light, prominent) ==========
    this.doc.setFillColor(245, 247, 250);
    this.doc.rect(0, 27.2, this.pageWidth, 9, 'F');
    this.doc.setTextColor(80, 90, 110);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text('EMPRESA', 8, 33);
    const empresaLabelWidth = this.doc.getTextWidth('EMPRESA');
    this.doc.setTextColor(12, 21, 57);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text((empresa || 'Empresa').toUpperCase(), 8 + empresaLabelWidth + 4, 33);

    this.currentY = 42;
  }

  private addDashboardKPIs(stats: FipePDFData['stats']) {
    const kpiData = [
      {
        label: 'Valor Total FIPE',
        value: this.formatCurrency(stats.totalFipeValue),
        count: stats.carros.count + stats.caminhoes.count + stats.motos.count + stats.outros.count,
        color: [59, 130, 246]
      },
      {
        label: 'Carros',
        value: this.formatCurrency(stats.carros.valor),
        count: stats.carros.count,
        color: [99, 102, 241]
      },
      {
        label: 'Caminhões',
        value: this.formatCurrency(stats.caminhoes.valor),
        count: stats.caminhoes.count,
        color: [251, 146, 60]
      },
      {
        label: 'Motos',
        value: this.formatCurrency(stats.motos.valor),
        count: stats.motos.count,
        color: [16, 185, 129]
      }
    ];

    const cardWidth = (this.pageWidth - (this.margin * 2) - 15) / 4;
    const cardHeight = 30;
    let xPos = this.margin;

    kpiData.forEach((kpi) => {
      // Card background — white/very light for high contrast text
      this.doc.setFillColor(255, 255, 255);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 3, 3, 'F');

      // Border in the accent color
      this.doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.setLineWidth(0.6);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 3, 3, 'S');

      // Left accent strip
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.rect(xPos, this.currentY, 2.2, cardHeight, 'F');

      // Icon swatch
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.roundedRect(xPos + 5, this.currentY + 3, 10, 10, 2, 2, 'F');

      // Label (dark gray)
      this.doc.setTextColor(80, 90, 110);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.label.toUpperCase(), xPos + 18, this.currentY + 9);

      // Value (Prussian blue, big)
      this.doc.setTextColor(12, 21, 57);
      this.doc.setFontSize(13);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, xPos + 18, this.currentY + 18);

      // Count
      this.doc.setTextColor(120, 130, 150);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${kpi.count} veículo${kpi.count !== 1 ? 's' : ''}`, xPos + 18, this.currentY + 25);

      xPos += cardWidth + 5;
    });

    this.currentY += cardHeight + 10;
  }

  private addVehiclesTable(veiculos: FrotaVeiculo[], empresa: string) {
    this.doc.setTextColor(12, 21, 57);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Lista de Veículos - Tabela FIPE', this.margin, this.currentY);

    this.currentY += 6;

    const tableData = veiculos.map(v => [
      `${v.marca || ''} ${v.modelo || ''}`.trim() || 'N/A',
      v.placa || 'N/A',
      v.codigo_fipe || 'N/A',
      v.ano_modelo?.toString() || 'N/A',
      v.combustivel || 'N/A',
      v.preco_nf ? this.formatCurrency(v.preco_nf) : 'N/A',
      v.preco_fipe ? this.formatCurrency(v.preco_fipe) : 'N/A',
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Veículo', 'Placa', 'Código FIPE', 'Ano', 'Combustível', 'Valor NF', 'FIPE Atual']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [12, 21, 57],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: this.margin, right: this.margin },
      styles: {
        cellPadding: 3,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25 },
        2: { cellWidth: 28 },
        3: { cellWidth: 18 },
        4: { cellWidth: 25 },
        5: { cellWidth: 32 },
        6: { cellWidth: 32 },
      },
      didDrawPage: () => {
        const pageCount = this.doc.getNumberOfPages();
        const currentPage = this.doc.getCurrentPageInfo().pageNumber;
        this.doc.setFontSize(7);
        this.doc.setTextColor(120, 120, 120);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(
          `${empresa}  •  Relatório FIPE`,
          8,
          this.pageHeight - 6
        );
        this.doc.text(
          `Página ${currentPage} de ${pageCount}`,
          this.pageWidth - 8,
          this.pageHeight - 6,
          { align: 'right' }
        );
      },
    });
  }

  async download(data: FipePDFData, filename: string = 'relatorio-fipe.pdf') {
    const empresa = (data.empresa || 'Empresa').replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';
    await this.addHeader(empresa, data.proprietario);
    this.addDashboardKPIs(data.stats);
    this.addVehiclesTable(data.veiculos, empresa);

    this.doc.save(filename);
  }

  async generate(data: FipePDFData): Promise<Uint8Array> {
    const empresa = (data.empresa || 'Empresa').replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';
    await this.addHeader(empresa, data.proprietario);
    this.addDashboardKPIs(data.stats);
    this.addVehiclesTable(data.veiculos, empresa);

    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }
}
