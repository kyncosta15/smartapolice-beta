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

      // Add professional pie chart for status distribution
      currentY = (pdf as any).lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 120) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Distribuição de Colaboradores por Status', 20, currentY);
      
      // Create professional pie chart
      const chartCenterX = pageWidth / 2;
      const chartCenterY = currentY + 50;
      const chartRadius = 35;
      let totalAngle = 0;
      
      const statusColors = [
        [76, 175, 80],    // Green for ativo
        [255, 152, 0],    // Orange for inativo
        [244, 67, 54],    // Red for suspenso
        [33, 150, 243],   // Blue for outros
        [156, 39, 176]    // Purple for additional
      ];
      
      // Draw pie slices
      Object.entries(statusCounts).forEach(([status, count], index) => {
        const percentage = (count as number) / stats.totalColaboradores;
        const angle = percentage * 2 * Math.PI;
        const color = statusColors[index % statusColors.length];
        
        // Draw pie slice using path
        const startX = chartCenterX + chartRadius * Math.cos(totalAngle);
        const startY = chartCenterY + chartRadius * Math.sin(totalAngle);
        const endX = chartCenterX + chartRadius * Math.cos(totalAngle + angle);
        const endY = chartCenterY + chartRadius * Math.sin(totalAngle + angle);
        
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(1);
        
        // Create path for pie slice
        const path = `M ${chartCenterX} ${chartCenterY} L ${startX} ${startY} A ${chartRadius} ${chartRadius} 0 ${angle > Math.PI ? 1 : 0} 1 ${endX} ${endY} Z`;
        
        // Simplified pie slice using triangular approximation
        const steps = Math.max(3, Math.floor(angle * 10));
        for (let i = 0; i < steps; i++) {
          const a1 = totalAngle + (angle * i / steps);
          const a2 = totalAngle + (angle * (i + 1) / steps);
          const x1 = chartCenterX + chartRadius * Math.cos(a1);
          const y1 = chartCenterY + chartRadius * Math.sin(a1);
          const x2 = chartCenterX + chartRadius * Math.cos(a2);
          const y2 = chartCenterY + chartRadius * Math.sin(a2);
          
          pdf.triangle(chartCenterX, chartCenterY, x1, y1, x2, y2, 'FD');
        }
        
        totalAngle += angle;
      });

      // Add professional legend
      let legendX = 20;
      let legendY = chartCenterY + 60;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      Object.entries(statusCounts).forEach(([status, count], index) => {
        const color = statusColors[index % statusColors.length];
        const percentage = ((count as number) / stats.totalColaboradores * 100).toFixed(1);
        
        // Legend color box
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(legendX, legendY - 3, 8, 6, 'F');
        
        // Legend text
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${percentage}%)`, legendX + 12, legendY);
        
        legendY += 12;
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

      // Add professional bar chart for cost distribution
      currentY = (pdf as any).lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 120) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Custos por Centro de Custo', 20, currentY);
      
      // Chart dimensions
      const chartX = 40;
      const chartY = currentY + 25;
      const chartWidth = pageWidth - 80;
      const chartHeight = 70;
      const maxCost = Math.max(...Object.values(costsByDept) as number[]);
      
      // Draw chart background
      pdf.setFillColor(250, 250, 250);
      pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F');
      
      // Draw axes with proper formatting
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(1);
      
      // Y-axis
      pdf.line(chartX, chartY, chartX, chartY + chartHeight);
      // X-axis
      pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
      
      // Y-axis labels (cost values)
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      for (let i = 0; i <= 5; i++) {
        const value = (maxCost * i) / 5;
        const y = chartY + chartHeight - (i * chartHeight / 5);
        
        // Grid lines
        if (i > 0) {
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(0.5);
          pdf.line(chartX, y, chartX + chartWidth, y);
        }
        
        // Y-axis labels
        pdf.setDrawColor(100, 100, 100);
        pdf.line(chartX - 3, y, chartX, y);
        pdf.text(`R$ ${(value / 1000).toFixed(0)}k`, chartX - 25, y + 2);
      }
      
      // Draw bars with proper spacing
      const departments = Object.keys(costsByDept);
      const barSpacing = 10;
      const totalBarWidth = chartWidth - (barSpacing * (departments.length + 1));
      const barWidth = totalBarWidth / departments.length;
      
      departments.forEach((dept, index) => {
        const cost = costsByDept[dept] as number;
        const barHeight = (cost / maxCost) * chartHeight;
        const barX = chartX + barSpacing + (index * (barWidth + barSpacing / departments.length));
        const barY = chartY + chartHeight - barHeight;
        
        // Bar color
        const colors = [
          [33, 150, 243],   // Blue
          [76, 175, 80],    // Green
          [255, 152, 0],    // Orange
          [156, 39, 176],   // Purple
          [244, 67, 54],    // Red
          [0, 150, 136],    // Teal
          [255, 193, 7]     // Amber
        ];
        const color = colors[index % colors.length];
        
        // Draw bar with gradient effect
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(barX, barY, barWidth, barHeight, 'F');
        
        // Bar border
        pdf.setDrawColor(color[0] - 20, color[1] - 20, color[2] - 20);
        pdf.setLineWidth(1);
        pdf.rect(barX, barY, barWidth, barHeight, 'S');
        
        // Value on top of bar
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        const valueText = `R$ ${cost.toLocaleString('pt-BR')}`;
        pdf.text(valueText, barX + barWidth/2 - 10, barY - 3);
        
        // X-axis labels (department names) - simpler approach
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        const labelText = dept.length > 8 ? dept.substring(0, 8) + '...' : dept;
        
        // Place label horizontally below bar
        const textX = barX + barWidth/2 - (labelText.length * 2);
        const textY = chartY + chartHeight + 15;
        pdf.text(labelText, textX, textY);
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