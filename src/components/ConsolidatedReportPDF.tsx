import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ConsolidatedReportPDFProps {
  className?: string;
}

export function ConsolidatedReportPDF({ className }: ConsolidatedReportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch data from database
      const [colaboradoresRes, apolicesRes, ticketsRes] = await Promise.all([
        supabase.from('colaboradores').select('*'),
        supabase.from('apolices_beneficios').select('*'),
        supabase.from('tickets').select('*')
      ]);

      const colaboradores = colaboradoresRes.data || [];
      const apolices = apolicesRes.data || [];
      const tickets = ticketsRes.data || [];

      // Calculate statistics
      const stats = {
        totalColaboradores: colaboradores.length,
        colaboradoresAtivos: colaboradores.filter(c => c.status === 'ativo').length,
        totalApolices: apolices.length,
        apolicesAtivas: apolices.filter(a => a.status === 'ativa').length,
        custoMensalTotal: colaboradores.reduce((sum, c) => sum + (Number(c.custo_mensal) || 0), 0),
        totalTickets: tickets.length,
        ticketsAbertos: tickets.filter(t => t.status === 'aberto').length,
        ticketsProcessados: tickets.filter(t => t.status === 'processada' || t.status === 'aprovado').length
      };

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(33, 150, 243);
      pdf.text('SmartBenefícios - Relatório Consolidado', 20, 30);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 40);
      pdf.text(`Usuário: ${user?.email || 'N/A'}`, 20, 50);

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumo Executivo', 20, 70);

      const summaryData = [
        ['Total de Colaboradores', stats.totalColaboradores.toString()],
        ['Colaboradores Ativos', stats.colaboradoresAtivos.toString()],
        ['Total de Apólices', stats.totalApolices.toString()],
        ['Apólices Ativas', stats.apolicesAtivas.toString()],
        ['Custo Mensal Total', `R$ ${stats.custoMensalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Total de Tickets', stats.totalTickets.toString()],
        ['Tickets em Aberto', stats.ticketsAbertos.toString()],
        ['Tickets Processados', stats.ticketsProcessados.toString()]
      ];

      autoTable(pdf, {
        startY: 80,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243] },
        styles: { fontSize: 10 }
      });

      // Collaborators by Status Chart (text representation)
      let currentY = (pdf as any).lastAutoTable.finalY + 20;
      
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text('Distribuição de Colaboradores por Status', 20, currentY);

      const statusCounts = colaboradores.reduce((acc: any, c) => {
        acc[c.status || 'indefinido'] = (acc[c.status || 'indefinido'] || 0) + 1;
        return acc;
      }, {});

      const statusData = Object.entries(statusCounts).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        count.toString(),
        `${((count as number / stats.totalColaboradores) * 100).toFixed(1)}%`
      ]);

      autoTable(pdf, {
        startY: currentY + 10,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: statusData,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80] },
        styles: { fontSize: 10 }
      });

      // Add pie chart for status distribution
      currentY = (pdf as any).lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(12);
      pdf.text('Gráfico de Distribuição por Status', 20, currentY);
      
      // Create pie chart
      const centerX = pageWidth / 2;
      const centerY = currentY + 40;
      const radius = 30;
      let startAngle = 0;
      
      const colors = [
        [76, 175, 80],   // Green for active
        [255, 152, 0],   // Orange for inactive
        [244, 67, 54],   // Red for others
        [33, 150, 243]   // Blue for additional
      ];
      
      Object.entries(statusCounts).forEach(([status, count], index) => {
        const angle = (count as number / stats.totalColaboradores) * 2 * Math.PI;
        const color = colors[index % colors.length];
        
        pdf.setFillColor(color[0], color[1], color[2]);
        
        // Draw pie slice
        const endAngle = startAngle + angle;
        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);
        
        // Simple pie slice representation using triangles
        pdf.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
        
        startAngle = endAngle;
      });

      // Add legend
      let legendY = centerY + radius + 20;
      Object.entries(statusCounts).forEach(([status, count], index) => {
        const color = colors[index % colors.length];
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(centerX - 60, legendY, 5, 5, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text(`${status}: ${count}`, centerX - 50, legendY + 4);
        legendY += 10;
      });

      // Cost Distribution by Department
      currentY = (pdf as any).lastAutoTable.finalY + 20;
      
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text('Distribuição de Custos por Centro de Custo', 20, currentY);

      const costsByDept = colaboradores.reduce((acc: any, c) => {
        const dept = c.centro_custo || 'Não informado';
        const cost = Number(c.custo_mensal) || 0;
        acc[dept] = (acc[dept] || 0) + cost;
        return acc;
      }, {});

      const costData = Object.entries(costsByDept).map(([dept, cost]) => [
        dept,
        `R$ ${(cost as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `${(((cost as number) / stats.custoMensalTotal) * 100).toFixed(1)}%`
      ]);

      autoTable(pdf, {
        startY: currentY + 10,
        head: [['Centro de Custo', 'Custo Mensal', 'Percentual']],
        body: costData,
        theme: 'grid',
        headStyles: { fillColor: [255, 152, 0] },
        styles: { fontSize: 10 }
      });

      // Add bar chart for cost distribution
      currentY = (pdf as any).lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 100) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(12);
      pdf.text('Gráfico de Custos por Centro de Custo', 20, currentY);
      
      // Create bar chart
      const chartStartX = 30;
      const chartStartY = currentY + 20;
      const chartWidth = pageWidth - 60;
      const chartHeight = 60;
      const maxCost = Math.max(...Object.values(costsByDept) as number[]);
      
      // Draw axes
      pdf.setDrawColor(0, 0, 0);
      pdf.line(chartStartX, chartStartY + chartHeight, chartStartX + chartWidth, chartStartY + chartHeight); // X-axis
      pdf.line(chartStartX, chartStartY, chartStartX, chartStartY + chartHeight); // Y-axis
      
      // Draw bars
      const barWidth = chartWidth / Object.keys(costsByDept).length - 10;
      let barX = chartStartX + 5;
      
      Object.entries(costsByDept).forEach(([dept, cost], index) => {
        const barHeight = ((cost as number) / maxCost) * chartHeight;
        const colors = [
          [33, 150, 243],   // Blue
          [76, 175, 80],    // Green
          [255, 152, 0],    // Orange
          [156, 39, 176],   // Purple
          [244, 67, 54]     // Red
        ];
        const color = colors[index % colors.length];
        
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(barX, chartStartY + chartHeight - barHeight, barWidth, barHeight, 'F');
        
        // Add label
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        const labelText = dept.length > 8 ? dept.substring(0, 8) + '...' : dept;
        pdf.text(labelText, barX, chartStartY + chartHeight + 10, { angle: 45 });
        
        barX += barWidth + 10;
      });

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `SmartBenefícios © ${new Date().getFullYear()} - Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `relatorio-consolidado-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório consolidado gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório consolidado');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      className={className}
      onClick={generatePDF}
      disabled={isGenerating}
    >
      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
      {isGenerating ? 'Gerando...' : 'Exportar PDF'}
    </Button>
  );
}