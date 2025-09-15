import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PDFDashboardData } from '@/hooks/usePDFDashboardData';
import { formatCurrency } from '@/utils/currencyFormatter';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export class DashboardPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 20;
  private currentY = 20;
  private pageCount = 1;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addHeader(data: PDFDashboardData) {
    // Logo e título
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(17, 24, 39); // gray-900
    this.doc.text('SmartApólice', this.margin, 30);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(75, 85, 99); // gray-600
    this.doc.text('Relatório Executivo de Apólices', this.margin, 40);

    // Informações da empresa/usuário
    this.doc.setFontSize(10);
    this.doc.setTextColor(107, 114, 128); // gray-500
    this.doc.text(`Empresa: ${data.generatedBy.company || 'Não informado'}`, this.margin, 50);
    this.doc.text(`Responsável: ${data.generatedBy.name} (${data.generatedBy.email})`, this.margin, 55);
    this.doc.text(`Gerado em: ${data.generatedAt.toLocaleString('pt-BR')}`, this.margin, 60);

    // Linha separadora
    this.doc.setDrawColor(229, 231, 235); // gray-200
    this.doc.line(this.margin, 65, this.pageWidth - this.margin, 65);
    
    this.currentY = 75;
  }

  private addPageFooter() {
    const footerY = this.pageHeight - 10;
    
    // Linha separadora
    this.doc.setDrawColor(229, 231, 235);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Texto do rodapé
    this.doc.setFontSize(8);
    this.doc.setTextColor(156, 163, 175); // gray-400
    this.doc.text('Gerado por SmartApólice — confidencial. Não distribuir sem autorização.', 
                  this.margin, footerY);
    
    // Numeração
    this.doc.text(`Página ${this.pageCount}`, this.pageWidth - 30, footerY);
  }

  private checkPageBreak(neededSpace: number = 30) {
    if (this.currentY + neededSpace > this.pageHeight - 20) {
      this.addPageFooter();
      this.doc.addPage();
      this.pageCount++;
      this.currentY = 20;
    }
  }

  private addTitle(title: string, fontSize: number = 14) {
    this.checkPageBreak(20);
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(17, 24, 39);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }

  private addSummaryCards(data: PDFDashboardData) {
    this.addTitle('Visão Geral');
    this.checkPageBreak(80);

    const cardData = [
      ['Métrica', 'Valor', 'Descrição'],
      ['Total de Apólices', data.totalPolicies.toString(), 'Apólices gerenciadas'],
      ['Prêmio Mensal', formatCurrency(data.totalMonthlyCost), 'Valor total dos prêmios'],
      ['Valor Segurado', formatCurrency(data.totalInsuredValue), 'Cobertura total'],
      ['Apólices Ativas', data.activePolicies.toString(), 'Em vigor atualmente'],
      ['Vencidas', data.expiredPolicies.toString(), 'Necessitam renovação'],
      ['Vencendo (30d)', data.expiringNext30Days.toString(), 'Próximos 30 dias']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [cardData[0]],
      body: cardData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246], // blue-500
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [31, 41, 55] // gray-800
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // gray-50
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  private addDistributionCharts(data: PDFDashboardData) {
    // Distribuição por Seguradora
    this.addTitle('Distribuição por Seguradora');
    this.checkPageBreak(60);

    if (data.insurerDistribution.length > 0) {
      const insurerData = [
        ['Seguradora', 'Qtd. Apólices', 'Valor Mensal', 'Participação (%)'],
        ...data.insurerDistribution.map(item => [
          item.name,
          item.count.toString(),
          formatCurrency(item.value),
          `${item.percentage}%`
        ])
      ];

      this.doc.autoTable({
        startY: this.currentY,
        head: [insurerData[0]],
        body: insurerData.slice(1),
        theme: 'striped',
        headStyles: { 
          fillColor: [16, 185, 129], // emerald-500
          textColor: 255,
          fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 15;
    } else {
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Nenhum dado de distribuição disponível.', this.margin, this.currentY);
      this.currentY += 15;
    }

    // Distribuição por Tipo
    this.addTitle('Distribuição por Tipo de Seguro');
    this.checkPageBreak(60);

    if (data.typeDistribution.length > 0) {
      const typeData = [
        ['Tipo de Seguro', 'Qtd. Apólices', 'Valor Mensal'],
        ...data.typeDistribution.map(item => [
          item.name,
          item.count.toString(),
          formatCurrency(item.value)
        ])
      ];

      this.doc.autoTable({
        startY: this.currentY,
        head: [typeData[0]],
        body: typeData.slice(1),
        theme: 'striped',
        headStyles: { 
          fillColor: [147, 51, 234], // purple-500
          textColor: 255,
          fontSize: 9
        },
        bodyStyles: { fontSize: 9 },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 15;
    }
  }

  private addRecentPolicies(data: PDFDashboardData) {
    this.addTitle('Apólices Recentes (Últimos 30 dias)');
    this.checkPageBreak(60);

    if (data.recentPolicies.length > 0) {
      const policiesData = [
        ['Nº Apólice', 'Segurado', 'Seguradora', 'Valor Mensal', 'Status', 'Data'],
        ...data.recentPolicies.map(policy => [
          policy.numero_apolice,
          policy.segurado.length > 25 ? policy.segurado.substring(0, 22) + '...' : policy.segurado,
          policy.seguradora.length > 20 ? policy.seguradora.substring(0, 17) + '...' : policy.seguradora,
          formatCurrency(policy.valor_mensal),
          policy.status,
          new Date(policy.created_at).toLocaleDateString('pt-BR')
        ])
      ];

      this.doc.autoTable({
        startY: this.currentY,
        head: [policiesData[0]],
        body: policiesData.slice(1),
        theme: 'striped',
        headStyles: { 
          fillColor: [245, 158, 11], // amber-500
          textColor: 255,
          fontSize: 8
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        },
        margin: { left: this.margin, right: this.margin }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 15;
    } else {
      this.doc.setFontSize(10);
      this.doc.setTextColor(107, 114, 128);
      this.doc.text('Nenhuma apólice recente encontrada.', this.margin, this.currentY);
      this.currentY += 15;
    }
  }

  private addComplementaryIndicators(data: PDFDashboardData) {
    this.addTitle('Indicadores Complementares');
    this.checkPageBreak(40);

    // Distribuição PF/PJ
    const personTypeData = [
      ['Tipo', 'Quantidade', 'Percentual'],
      ['Pessoa Física', data.personTypeDistribution.pessoaFisica.toString(), 
       `${Math.round((data.personTypeDistribution.pessoaFisica / data.totalPolicies) * 100)}%`],
      ['Pessoa Jurídica', data.personTypeDistribution.pessoaJuridica.toString(),
       `${Math.round((data.personTypeDistribution.pessoaJuridica / data.totalPolicies) * 100)}%`]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [personTypeData[0]],
      body: personTypeData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: [99, 102, 241], // indigo-500
        textColor: 255,
        fontSize: 10
      },
      bodyStyles: { fontSize: 10 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;

    // Métricas adicionais
    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    this.doc.text(`Custo médio por apólice: ${formatCurrency(data.totalMonthlyCost / (data.totalPolicies || 1))}`, 
                  this.margin, this.currentY);
    this.currentY += 6;
    
    const maxCost = Math.max(...data.insurerDistribution.map(i => i.value));
    this.doc.text(`Maior custo por seguradora: ${formatCurrency(maxCost)}`, 
                  this.margin, this.currentY);
    this.currentY += 10;
  }

  private addSummaryIndex() {
    this.checkPageBreak(50);
    
    this.addTitle('Sumário');
    
    const summaryItems = [
      'Visão Geral • Cards principais do dashboard',
      'Distribuições • Por seguradora e tipo de seguro',  
      'Apólices Recentes • Últimos 30 dias',
      'Indicadores Complementares • Pessoa Física/Jurídica e métricas'
    ];

    this.doc.setFontSize(10);
    this.doc.setTextColor(75, 85, 99);
    
    summaryItems.forEach(item => {
      this.doc.text(`• ${item}`, this.margin + 5, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  public generate(data: PDFDashboardData): Uint8Array {
    try {
      console.log('🎯 Iniciando geração do PDF...');
      
      // Capa
      this.addHeader(data);
      
      // Sumário
      this.addSummaryIndex();
      
      // Conteúdo principal
      this.addSummaryCards(data);
      this.addDistributionCharts(data);
      this.addRecentPolicies(data);
      this.addComplementaryIndicators(data);
      
      // Rodapé da última página
      this.addPageFooter();
      
      console.log('✅ PDF gerado com sucesso');
      return new Uint8Array(this.doc.output('arraybuffer'));
      
    } catch (error) {
      console.error('❌ Erro na geração do PDF:', error);
      throw error;
    }
  }

  public download(data: PDFDashboardData, filename?: string) {
    try {
      const pdfBytes = this.generate(data);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const defaultFilename = `SmartApolice-Relatorio-${
        data.generatedBy.company?.replace(/[^a-zA-Z0-9]/g, '-') || 'Dashboard'
      }-${data.generatedAt.toISOString().split('T')[0]}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Download do PDF iniciado:', filename || defaultFilename);
    } catch (error) {
      console.error('❌ Erro no download do PDF:', error);
      throw error;
    }
  }
}