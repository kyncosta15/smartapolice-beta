import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FrotaVeiculo } from '@/hooks/useFrotasData';

interface FipePDFData {
  veiculos: FrotaVeiculo[];
  stats: {
    totalFipeValue: number;
    carros: { valor: number; count: number };
    caminhoes: { valor: number; count: number };
    motos: { valor: number; count: number };
    outros: { valor: number; count: number };
  };
}

export class FipePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
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

  private addHeader() {
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Relatório FIPE - Gestão de Frotas', this.pageWidth / 2, 12, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, this.pageWidth / 2, 19, { align: 'center' });
    
    this.currentY = 35;
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
    const cardHeight = 25;
    let xPos = this.margin;

    kpiData.forEach((kpi) => {
      // Card background
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2], 0.1);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 2, 2, 'F');
      
      // Icon background
      this.doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      this.doc.roundedRect(xPos + 3, this.currentY + 3, 10, 10, 2, 2, 'F');
      
      // Label
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(kpi.label, xPos + 15, this.currentY + 8);
      
      // Value
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, xPos + 15, this.currentY + 15);
      
      // Count
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${kpi.count} veículo${kpi.count !== 1 ? 's' : ''}`, xPos + 15, this.currentY + 20);
      
      xPos += cardWidth + 5;
    });

    this.currentY += cardHeight + 15;
  }

  private addVehiclesTable(veiculos: FrotaVeiculo[]) {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Lista de Veículos - Tabela FIPE', this.margin, this.currentY);
    
    this.currentY += 8;

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
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
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
        0: { cellWidth: 45 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 },
      },
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  generate(data: FipePDFData): Uint8Array {
    this.addHeader();
    this.addDashboardKPIs(data.stats);
    this.addVehiclesTable(data.veiculos);
    this.addFooter();

    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }

  download(data: FipePDFData, filename: string = 'relatorio-fipe.pdf') {
    this.addHeader();
    this.addDashboardKPIs(data.stats);
    this.addVehiclesTable(data.veiculos);
    this.addFooter();

    this.doc.save(filename);
  }
}
