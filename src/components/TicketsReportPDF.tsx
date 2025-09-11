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

interface TicketsReportPDFProps {
  className?: string;
}

export function TicketsReportPDF({ className }: TicketsReportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch tickets data
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Erro ao buscar dados dos tickets');
      }

      const ticketsData = tickets || [];

      // Calculate statistics
      const stats = {
        total: ticketsData.length,
        recebidas: ticketsData.filter(t => t.status === 'aberto').length,
        processadas: ticketsData.filter(t => t.status === 'processada' || t.status === 'aprovado').length,
        erros: ticketsData.filter(t => t.status === 'erro' || t.status === 'rejeitado').length,
        aprovadas: ticketsData.filter(t => t.status === 'aprovado').length,
        rejeitadas: ticketsData.filter(t => t.status === 'rejeitado').length
      };

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(33, 150, 243);
      pdf.text('SmartBenefícios - Relatório de Tickets', 20, 30);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 40);
      pdf.text(`Usuário: ${user?.email || 'N/A'}`, 20, 50);
      pdf.text(`Período: Histórico completo`, 20, 60);

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Resumo Executivo', 20, 80);

      const summaryData = [
        ['Total de Protocolos', stats.total.toString()],
        ['Solicitações Recebidas', stats.recebidas.toString()],
        ['Solicitações Processadas', stats.processadas.toString()],
        ['Solicitações com Erro', stats.erros.toString()],
        ['Taxa de Aprovação', stats.total > 0 ? `${((stats.aprovadas / stats.total) * 100).toFixed(1)}%` : '0%'],
        ['Taxa de Rejeição', stats.total > 0 ? `${((stats.rejeitadas / stats.total) * 100).toFixed(1)}%` : '0%']
      ];

      autoTable(pdf, {
        startY: 90,
        head: [['Métrica', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243] },
        styles: { fontSize: 10 }
      });

      // Status Distribution
      let currentY = (pdf as any).lastAutoTable.finalY + 20;
      
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text('Distribuição por Status', 20, currentY);

      const statusData = [
        ['Recebidas', stats.recebidas.toString(), stats.total > 0 ? `${((stats.recebidas / stats.total) * 100).toFixed(1)}%` : '0%'],
        ['Processadas', stats.processadas.toString(), stats.total > 0 ? `${((stats.processadas / stats.total) * 100).toFixed(1)}%` : '0%'],
        ['Com Erro', stats.erros.toString(), stats.total > 0 ? `${((stats.erros / stats.total) * 100).toFixed(1)}%` : '0%']
      ];

      autoTable(pdf, {
        startY: currentY + 10,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: statusData,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80] },
        styles: { fontSize: 10 }
      });

      // Add professional donut chart for status distribution
      currentY = (pdf as any).lastAutoTable.finalY + 30;
      if (currentY > pageHeight - 120) {
        pdf.addPage();
        currentY = 30;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Distribuição de Status dos Tickets', 20, currentY);
      
      // Professional donut chart
      const chartCenterX = pageWidth / 2;
      const chartCenterY = currentY + 50;
      const outerRadius = 40;
      const innerRadius = 25;
      let totalAngle = 0;
      
      const statusColors = [
        [33, 150, 243],   // Blue for received
        [76, 175, 80],    // Green for processed  
        [244, 67, 54]     // Red for errors
      ];
      
      const statusValues = [stats.recebidas, stats.processadas, stats.erros];
      const statusLabels = ['Recebidas', 'Processadas', 'Com Erro'];
      
      // Draw donut segments
      statusValues.forEach((value, index) => {
        if (value > 0) {
          const percentage = value / stats.total;
          const angle = percentage * 2 * Math.PI;
          const color = statusColors[index];
          
          // Draw outer circle segments
          const steps = Math.max(5, Math.floor(angle * 15));
          for (let i = 0; i < steps; i++) {
            const a1 = totalAngle + (angle * i / steps);
            const a2 = totalAngle + (angle * (i + 1) / steps);
            
            // Outer points
            const x1_outer = chartCenterX + outerRadius * Math.cos(a1);
            const y1_outer = chartCenterY + outerRadius * Math.sin(a1);
            const x2_outer = chartCenterX + outerRadius * Math.cos(a2);
            const y2_outer = chartCenterY + outerRadius * Math.sin(a2);
            
            // Inner points
            const x1_inner = chartCenterX + innerRadius * Math.cos(a1);
            const y1_inner = chartCenterY + innerRadius * Math.sin(a1);
            const x2_inner = chartCenterX + innerRadius * Math.cos(a2);
            const y2_inner = chartCenterY + innerRadius * Math.sin(a2);
            
            // Draw trapezoid segment
            pdf.setFillColor(color[0], color[1], color[2]);
            pdf.setDrawColor(255, 255, 255);
            pdf.setLineWidth(1);
            
            // Create path for donut segment
            pdf.lines([
              [x1_outer - chartCenterX, y1_outer - chartCenterY],
              [x2_outer - chartCenterX, y2_outer - chartCenterY],
              [x2_inner - chartCenterX, y2_inner - chartCenterY],
              [x1_inner - chartCenterX, y1_inner - chartCenterY]
            ], chartCenterX, chartCenterY, [1, 1], 'FD');
          }
          
          totalAngle += angle;
        }
      });

      // Add center circle (white)
      pdf.setFillColor(255, 255, 255);
      pdf.circle(chartCenterX, chartCenterY, innerRadius, 'F');
      
      // Add total in center
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${stats.total}`, chartCenterX - 8, chartCenterY - 5);
      pdf.setFontSize(10);
      pdf.text('Total', chartCenterX - 8, chartCenterY + 5);

      // Professional legend
      let legendX = 20;
      let legendY = chartCenterY + 70;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      statusValues.forEach((value, index) => {
        if (value > 0) {
          const color = statusColors[index];
          const percentage = ((value / stats.total) * 100).toFixed(1);
          
          // Legend color box
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(legendX, legendY - 3, 8, 6, 'F');
          
          // Legend text
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${statusLabels[index]}: ${value} (${percentage}%)`, legendX + 12, legendY);
          
          legendX += 80;
        }
      });

      // Monthly Trend (last 6 months)
      currentY = (pdf as any).lastAutoTable.finalY + 20;
      
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 30;
      }
      
      pdf.setFontSize(14);
      pdf.text('Tendência Mensal (Últimos 6 Meses)', 20, currentY);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = ticketsData
        .filter(t => new Date(t.created_at) >= sixMonthsAgo)
        .reduce((acc: any, ticket) => {
          const month = new Date(ticket.created_at).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'short' 
          });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

      const monthlyTrendData = Object.entries(monthlyData).map(([month, count]) => [
        month,
        count.toString()
      ]);

      if (monthlyTrendData.length > 0) {
        autoTable(pdf, {
          startY: currentY + 10,
          head: [['Mês', 'Quantidade de Tickets']],
          body: monthlyTrendData,
          theme: 'grid',
          headStyles: { fillColor: [255, 152, 0] },
          styles: { fontSize: 10 }
        });

        // Add professional line chart for monthly trend
        currentY = (pdf as any).lastAutoTable.finalY + 30;
        if (currentY > pageHeight - 120) {
          pdf.addPage();
          currentY = 30;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Tendência Mensal de Tickets', 20, currentY);
        
        // Chart dimensions
        const chartX = 40;
        const chartY = currentY + 25;
        const chartWidth = pageWidth - 80;
        const chartHeight = 70;
        const maxTickets = Math.max(...Object.values(monthlyData) as number[]);
        const months = Object.keys(monthlyData);
        
        // Draw chart background
        pdf.setFillColor(250, 250, 250);
        pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F');
        
        // Draw axes
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(1);
        
        // Y-axis
        pdf.line(chartX, chartY, chartX, chartY + chartHeight);
        // X-axis  
        pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
        
        // Y-axis grid and labels
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        for (let i = 0; i <= 5; i++) {
          const value = Math.ceil((maxTickets * i) / 5);
          const y = chartY + chartHeight - (i * chartHeight / 5);
          
          // Grid lines
          if (i > 0) {
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.3);
            pdf.line(chartX, y, chartX + chartWidth, y);
          }
          
          // Y-axis labels
          pdf.setDrawColor(100, 100, 100);
          pdf.setLineWidth(1);
          pdf.line(chartX - 3, y, chartX, y);
          pdf.text(value.toString(), chartX - 15, y + 2);
        }
        
        // Draw line chart
        if (months.length > 1) {
          const stepX = chartWidth / (months.length - 1);
          let prevX = chartX;
          let prevY = chartY + chartHeight - ((Object.values(monthlyData)[0] as number / maxTickets) * chartHeight);
          
          // Draw line segments
          pdf.setDrawColor(33, 150, 243);
          pdf.setLineWidth(2);
          
          Object.values(monthlyData).forEach((count, index) => {
            if (index > 0) {
              const currentX = chartX + index * stepX;
              const currentY = chartY + chartHeight - ((count as number / maxTickets) * chartHeight);
              
              // Draw line segment
              pdf.line(prevX, prevY, currentX, currentY);
              
              prevX = currentX;
              prevY = currentY;
            }
          });
          
          // Draw data points
          pdf.setFillColor(33, 150, 243);
          Object.values(monthlyData).forEach((count, index) => {
            const x = chartX + index * stepX;
            const y = chartY + chartHeight - ((count as number / maxTickets) * chartHeight);
            
            // Data point circle
            pdf.circle(x, y, 3, 'F');
            
            // Value label above point
            pdf.setFontSize(7);
            pdf.setTextColor(0, 0, 0);
            pdf.text(count.toString(), x - 3, y - 5);
          });
        }
        
        // X-axis labels
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        months.forEach((month, index) => {
          const x = chartX + (index * chartWidth / (months.length - 1));
          
          // Tick mark
          pdf.setDrawColor(100, 100, 100);
          pdf.line(x, chartY + chartHeight, x, chartY + chartHeight + 3);
          
          // Month label
          pdf.text(month, x - 10, chartY + chartHeight + 12);
        });
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Nenhum ticket encontrado nos últimos 6 meses', 20, currentY + 20);
      }

      // Recent Tickets Details
      currentY = (pdf as any).lastAutoTable?.finalY + 30 || currentY + 50;
      
      if (currentY > pageHeight - 60) {
        pdf.addPage();
        currentY = 30;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Últimos 10 Tickets', 20, currentY);

      const recentTickets = ticketsData.slice(0, 10);
      const ticketsTableData = recentTickets.map(ticket => {
        const payload = ticket.payload as any;
        return [
          ticket.protocol_code || 'N/A',
          ticket.status === 'aberto' ? 'Recebida' : 
          ticket.status === 'processada' ? 'Processada' :
          ticket.status === 'aprovado' ? 'Aprovada' :
          ticket.status === 'rejeitado' ? 'Rejeitada' : ticket.status,
          payload?.employee?.full_name || 'N/A',
          new Date(ticket.created_at).toLocaleDateString('pt-BR')
        ];
      });

      if (ticketsTableData.length > 0) {
        autoTable(pdf, {
          startY: currentY + 10,
          head: [['Protocolo', 'Status', 'Colaborador', 'Data']],
          body: ticketsTableData,
          theme: 'grid',
          headStyles: { fillColor: [156, 39, 176] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 30 },
            2: { cellWidth: 60 },
            3: { cellWidth: 30 }
          }
        });
      }

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
      const fileName = `relatorio-tickets-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Relatório de tickets gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório de tickets');
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