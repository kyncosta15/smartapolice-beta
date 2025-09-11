import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

      pdf.autoTable({
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

      pdf.autoTable({
        startY: currentY + 10,
        head: [['Status', 'Quantidade', 'Percentual']],
        body: statusData,
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80] },
        styles: { fontSize: 10 }
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
        pdf.autoTable({
          startY: currentY + 10,
          head: [['Mês', 'Quantidade de Tickets']],
          body: monthlyTrendData,
          theme: 'grid',
          headStyles: { fillColor: [255, 152, 0] },
          styles: { fontSize: 10 }
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
        pdf.autoTable({
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