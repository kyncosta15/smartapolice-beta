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
  valorizacao?: {
    valorizacaoTotal: number;
    percentualMedio: number;
    veiculosValorizados: number;
    veiculosDesvalorizados: number;
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
        color: [59, 130, 246],
        icon: 'dollar' as const,
      },
      {
        label: 'Carros',
        value: this.formatCurrency(stats.carros.valor),
        count: stats.carros.count,
        color: [99, 102, 241],
        icon: 'car' as const,
      },
      {
        label: 'Caminhões',
        value: this.formatCurrency(stats.caminhoes.valor),
        count: stats.caminhoes.count,
        color: [251, 146, 60],
        icon: 'truck' as const,
      },
      {
        label: 'Motos',
        value: this.formatCurrency(stats.motos.valor),
        count: stats.motos.count,
        color: [16, 185, 129],
        icon: 'bike' as const,
      }
    ];

    const gap = 5;
    const cardWidth = (this.pageWidth - (this.margin * 2) - gap * 3) / 4;
    const cardHeight = 26;
    let xPos = this.margin;

    kpiData.forEach((kpi) => {
      // Card background — white for high contrast text
      this.doc.setFillColor(255, 255, 255);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 2.5, 2.5, 'F');

      // Subtle border
      this.doc.setDrawColor(225, 230, 240);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 2.5, 2.5, 'S');

      // Left accent strip (slim)
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.roundedRect(xPos, this.currentY, 1.5, cardHeight, 0.75, 0.75, 'F');

      // Simple line icon (no background swatch)
      const iconCx = xPos + 8;
      const iconCy = this.currentY + 7;
      this.doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.setLineWidth(0.45);
      this.drawSimpleIcon(kpi.icon, iconCx, iconCy);

      const textX = xPos + 14;

      // Label (uppercase, gray)
      this.doc.setTextColor(110, 120, 140);
      this.doc.setFontSize(7.5);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.label.toUpperCase(), textX, this.currentY + 8);

      // Value (Prussian blue, big)
      this.doc.setTextColor(12, 21, 57);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, textX, this.currentY + 16);

      // Count
      this.doc.setTextColor(140, 150, 170);
      this.doc.setFontSize(7.5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${kpi.count} veículo${kpi.count !== 1 ? 's' : ''}`, textX, this.currentY + 22);

      xPos += cardWidth + gap;
    });

    this.currentY += cardHeight + 10;
  }

  // Desenha ícones de linha simples (estilo Lucide) centralizados em (cx, cy), tamanho ~7mm
  private drawSimpleIcon(icon: 'dollar' | 'car' | 'truck' | 'bike', cx: number, cy: number) {
    const d = this.doc;
    if (icon === 'dollar') {
      // Círculo + cifrão
      d.circle(cx, cy, 3.2, 'S');
      d.setFontSize(8);
      d.setFont('helvetica', 'bold');
      // Reaproveita a cor do traço para o texto
      const stroke = (d as any).getDrawColor?.() || '';
      // Pega cor atual do desenho via re-set: já está setada antes da chamada
      d.text('$', cx, cy + 1.4, { align: 'center' });
    } else if (icon === 'car') {
      // Carro: corpo (retângulo arredondado) + janelas + duas rodas
      d.roundedRect(cx - 3.2, cy - 0.6, 6.4, 2.6, 0.6, 0.6, 'S');
      // teto/janelas
      d.line(cx - 2.2, cy - 0.6, cx - 1.4, cy - 2.2);
      d.line(cx - 1.4, cy - 2.2, cx + 1.4, cy - 2.2);
      d.line(cx + 1.4, cy - 2.2, cx + 2.2, cy - 0.6);
      // rodas
      d.circle(cx - 2, cy + 2, 0.6, 'S');
      d.circle(cx + 2, cy + 2, 0.6, 'S');
    } else if (icon === 'truck') {
      // Caminhão: cabine + baú + rodas
      d.roundedRect(cx - 3.4, cy - 0.4, 3.8, 2.6, 0.4, 0.4, 'S'); // baú
      d.roundedRect(cx + 0.4, cy + 0.4, 2.6, 1.8, 0.3, 0.3, 'S'); // cabine
      d.line(cx + 0.6, cy + 0.4, cx + 0.6, cy - 0.6); // janela superior
      d.line(cx + 0.6, cy - 0.6, cx + 2.6, cy - 0.6);
      d.line(cx + 2.6, cy - 0.6, cx + 3.0, cy + 0.4);
      // rodas
      d.circle(cx - 2.2, cy + 2.6, 0.6, 'S');
      d.circle(cx + 1.8, cy + 2.6, 0.6, 'S');
    } else if (icon === 'bike') {
      // Moto: duas rodas + barra
      d.circle(cx - 2.2, cy + 1.5, 1.2, 'S');
      d.circle(cx + 2.2, cy + 1.5, 1.2, 'S');
      d.line(cx - 2.2, cy + 1.5, cx, cy - 1.2);
      d.line(cx, cy - 1.2, cx + 2.2, cy + 1.5);
      d.line(cx - 0.4, cy - 1.2, cx + 1.4, cy - 1.2);
      // guidão
      d.line(cx + 1.6, cy - 1.6, cx + 2.6, cy - 1.6);
    }
  }

  private addValorizacaoKPIs(v: NonNullable<FipePDFData['valorizacao']>) {
    const positivo = v.valorizacaoTotal >= 0;
    const positivoPct = v.percentualMedio >= 0;

    const kpiData = [
      {
        label: 'Valorização Total',
        value: `${positivo ? '' : '-'}R$ ${Math.abs(v.valorizacaoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        valueColor: positivo ? [22, 163, 74] : [220, 38, 38],
        accent: positivo ? [22, 163, 74] : [220, 38, 38],
      },
      {
        label: 'Média de Diferença',
        value: `${positivoPct ? '' : ''}${v.percentualMedio.toFixed(2)}%`,
        valueColor: positivoPct ? [22, 163, 74] : [220, 38, 38],
        accent: positivoPct ? [22, 163, 74] : [220, 38, 38],
      },
      {
        label: 'Valorizados',
        value: String(v.veiculosValorizados),
        valueColor: [22, 163, 74],
        accent: [22, 163, 74],
      },
      {
        label: 'Desvalorizados',
        value: String(v.veiculosDesvalorizados),
        valueColor: [220, 38, 38],
        accent: [220, 38, 38],
      },
    ];

    const gap = 5;
    const cardWidth = (this.pageWidth - (this.margin * 2) - gap * 3) / 4;
    const cardHeight = 22;
    let xPos = this.margin;

    kpiData.forEach((kpi) => {
      // Card background
      this.doc.setFillColor(255, 255, 255);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 2.5, 2.5, 'F');

      // Subtle border
      this.doc.setDrawColor(225, 230, 240);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 2.5, 2.5, 'S');

      // Left accent strip
      this.doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
      this.doc.roundedRect(xPos, this.currentY, 1.5, cardHeight, 0.75, 0.75, 'F');

      const textX = xPos + 6;

      // Label
      this.doc.setTextColor(110, 120, 140);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.label, textX, this.currentY + 8);

      // Value (colored)
      this.doc.setTextColor(kpi.valueColor[0], kpi.valueColor[1], kpi.valueColor[2]);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, textX, this.currentY + 17);

      xPos += cardWidth + gap;
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
    if (data.valorizacao) this.addValorizacaoKPIs(data.valorizacao);
    this.addVehiclesTable(data.veiculos, empresa);

    this.doc.save(filename);
  }

  async generate(data: FipePDFData): Promise<Uint8Array> {
    const empresa = (data.empresa || 'Empresa').replace(/^Cliente\s*-\s*/i, '').trim() || 'Empresa';
    await this.addHeader(empresa, data.proprietario);
    this.addDashboardKPIs(data.stats);
    if (data.valorizacao) this.addValorizacaoKPIs(data.valorizacao);
    this.addVehiclesTable(data.veiculos, empresa);

    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }
}
