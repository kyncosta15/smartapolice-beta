import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';
import { supabase } from '@/integrations/supabase/client';

interface PDFReportGeneratorProps {
  policies: ParsedPolicyData[];
  dashboardData: any;
}

export function PDFReportGenerator({ policies, dashboardData }: PDFReportGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const generateCustomPDF = async () => {
    try {
      toast({
        title: "Gerando relatório PDF...",
        description: "Criando documento customizado com gráficos.",
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Função auxiliar para quebra de página
      const checkPageBreak = (neededSpace: number) => {
        if (yPosition + neededSpace > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // CABEÇALHO DO RELATÓRIO
      pdf.setFontSize(24);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Relatório de Apólices - SmartApólice', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, yPosition);
      yPosition += 10;

      if (user?.name) {
        pdf.text(`Usuário: ${user.name}`, 20, yPosition);
        yPosition += 15;
      }

      // Linha separadora
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 20;

      // RESUMO EXECUTIVO
      checkPageBreak(60);
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('RESUMO EXECUTIVO', 20, yPosition);
      yPosition += 15;

      // KPIs em formato tabular
      const kpis = [
        ['Total de Apólices', `${dashboardData.totalPolicies || policies.length} apólices`],
        ['Custo Mensal Total', formatCurrency(dashboardData.totalMonthlyCost || 0)],
        ['Valor Segurado Total', formatCurrency(dashboardData.totalInsuredValue || 0)],
        ['Apólices Vencendo', `${dashboardData.expiringPolicies || 0} em 30 dias`]
      ];

      pdf.setFontSize(12);
      kpis.forEach(([label, value]) => {
        pdf.setTextColor(102, 102, 102);
        pdf.text(label + ':', 25, yPosition);
        pdf.setTextColor(51, 51, 51);
        pdf.text(value, 90, yPosition);
        yPosition += 8;
      });

      yPosition += 15;

      // DISTRIBUIÇÃO POR SEGURADORA
      checkPageBreak(80);
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('DISTRIBUIÇÃO POR SEGURADORA', 20, yPosition);
      yPosition += 15;

      if (dashboardData.insurerDistribution && dashboardData.insurerDistribution.length > 0) {
        // Criar gráfico de barras simples usando retângulos
        const maxBarWidth = 100;
        const maxValue = Math.max(...dashboardData.insurerDistribution.map((item: any) => item.value));

        dashboardData.insurerDistribution.slice(0, 6).forEach((item: any, index: number) => {
          const barWidth = (item.value / maxValue) * maxBarWidth;
          const barHeight = 6;
          
          // Nome da seguradora
          pdf.setFontSize(10);
          pdf.setTextColor(51, 51, 51);
          pdf.text(item.name, 25, yPosition);
          
          // Barra
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
          const color = colors[index % colors.length];
          const [r, g, b] = [
            parseInt(color.slice(1, 3), 16),
            parseInt(color.slice(3, 5), 16),
            parseInt(color.slice(5, 7), 16)
          ];
          
          pdf.setFillColor(r, g, b);
          pdf.rect(90, yPosition - 4, barWidth, barHeight, 'F');
          
          // Valor
          pdf.setTextColor(102, 102, 102);
          pdf.text(`${item.value} (${((item.value / dashboardData.totalPolicies) * 100).toFixed(1)}%)`, 
                   195 - barWidth, yPosition);
          
          yPosition += 12;
        });
      }

      yPosition += 15;

      // DISTRIBUIÇÃO POR TIPO DE SEGURO
      checkPageBreak(80);
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('DISTRIBUIÇÃO POR TIPO DE SEGURO', 20, yPosition);
      yPosition += 15;

      if (dashboardData.typeDistribution && dashboardData.typeDistribution.length > 0) {
        const maxValue = Math.max(...dashboardData.typeDistribution.map((item: any) => item.value));
        
        dashboardData.typeDistribution.forEach((item: any, index: number) => {
          const barWidth = (item.value / maxValue) * 100;
          
          pdf.setFontSize(10);
          pdf.setTextColor(51, 51, 51);
          pdf.text(item.name, 25, yPosition);
          
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
          const color = colors[index % colors.length];
          const [r, g, b] = [
            parseInt(color.slice(1, 3), 16),
            parseInt(color.slice(3, 5), 16),
            parseInt(color.slice(5, 7), 16)
          ];
          
          pdf.setFillColor(r, g, b);
          pdf.rect(90, yPosition - 4, barWidth, 6, 'F');
          
          pdf.setTextColor(102, 102, 102);
          pdf.text(`${item.value} apólices`, 195 - barWidth, yPosition);
          
          yPosition += 12;
        });
      }

      yPosition += 15;

      // EVOLUÇÃO MENSAL DE CUSTOS
      checkPageBreak(100);
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('EVOLUÇÃO MENSAL DE CUSTOS', 20, yPosition);
      yPosition += 15;

      if (dashboardData.monthlyEvolution && dashboardData.monthlyEvolution.length > 0) {
        // Criar gráfico de linha simples
        const chartWidth = 150;
        const chartHeight = 60;
        const chartStartX = 30;
        const chartStartY = yPosition + 10;

        // Eixos
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(chartStartX, chartStartY, chartStartX, chartStartY + chartHeight); // Eixo Y
        pdf.line(chartStartX, chartStartY + chartHeight, chartStartX + chartWidth, chartStartY + chartHeight); // Eixo X

        // Dados do gráfico
        const dataPoints = dashboardData.monthlyEvolution.slice(-6); // Últimos 6 meses
        const maxCost = Math.max(...dataPoints.map((item: any) => item.custo));
        
        // Plotar pontos e linha
        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(1);
        
        for (let i = 0; i < dataPoints.length - 1; i++) {
          const x1 = chartStartX + (i / (dataPoints.length - 1)) * chartWidth;
          const y1 = chartStartY + chartHeight - (dataPoints[i].custo / maxCost) * chartHeight;
          const x2 = chartStartX + ((i + 1) / (dataPoints.length - 1)) * chartWidth;
          const y2 = chartStartY + chartHeight - (dataPoints[i + 1].custo / maxCost) * chartHeight;
          
          pdf.line(x1, y1, x2, y2);
          
          // Ponto
          pdf.setFillColor(59, 130, 246);
          pdf.circle(x1, y1, 1, 'F');
        }

        // Último ponto
        const lastX = chartStartX + chartWidth;
        const lastY = chartStartY + chartHeight - (dataPoints[dataPoints.length - 1].custo / maxCost) * chartHeight;
        pdf.circle(lastX, lastY, 1, 'F');

        // Labels dos meses
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        dataPoints.forEach((item: any, index: number) => {
          const x = chartStartX + (index / (dataPoints.length - 1)) * chartWidth;
          pdf.text(item.month, x - 5, chartStartY + chartHeight + 8);
        });

        // Valor máximo e médio
        yPosition += 85;
        pdf.setFontSize(10);
        pdf.setTextColor(51, 51, 51);
        pdf.text(`Custo máximo: ${formatCurrency(maxCost)}`, 25, yPosition);
        const avgCost = dataPoints.reduce((sum: number, item: any) => sum + item.custo, 0) / dataPoints.length;
        pdf.text(`Custo médio: ${formatCurrency(avgCost)}`, 120, yPosition);
      }

      yPosition += 20;

      // APÓLICES RECENTES
      checkPageBreak(120);
      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('APÓLICES MAIS RECENTES', 20, yPosition);
      yPosition += 15;

      const recentPolicies = policies
        .sort((a, b) => new Date(b.extractedAt || '').getTime() - new Date(a.extractedAt || '').getTime())
        .slice(0, 8);

      recentPolicies.forEach((policy, index) => {
        checkPageBreak(20);
        
        pdf.setFontSize(11);
        pdf.setTextColor(51, 51, 51);
        pdf.text(`${index + 1}. ${policy.name || 'Apólice sem nome'}`, 25, yPosition);
        
        pdf.setFontSize(9);
        pdf.setTextColor(102, 102, 102);
        pdf.text(`${policy.insurer || 'Seguradora N/I'}`, 25, yPosition + 6);
        pdf.text(`Valor: ${formatCurrency(policy.premium || 0)}`, 120, yPosition);
        pdf.text(`Inserida: ${new Date(policy.extractedAt || '').toLocaleDateString('pt-BR')}`, 120, yPosition + 6);
        
        yPosition += 16;
      });

      // RODAPÉ
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('SmartApólice - Sistema de Gestão de Apólices', 20, pageHeight - 10);
      pdf.text(`Página ${pdf.getNumberOfPages()}`, pageWidth - 40, pageHeight - 10);

      // Salvar arquivo
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `relatorio-apolices-${timestamp}.pdf`;
      
      pdf.save(fileName);

      toast({
        title: "Relatório gerado com sucesso!",
        description: `Arquivo ${fileName} foi baixado.`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante a geração do relatório.",
        variant: "destructive"
      });
    }
  };

  const sendReportByEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Email não encontrado",
        description: "Não foi possível identificar seu email para envio.",
        variant: "destructive"
      });
      return;
    }

    setIsEmailLoading(true);
    
    try {
      toast({
        title: "Enviando relatório por email...",
        description: "Gerando e enviando documento para seu email.",
      });

      const { error } = await supabase.functions.invoke('send-monthly-report', {
        body: { 
          userEmail: user.email,
          userName: user.name || 'Usuário'
        }
      });

      if (error) throw error;

      toast({
        title: "Relatório enviado com sucesso!",
        description: `O relatório foi enviado para ${user.email}`,
      });

    } catch (error) {
      console.error('Erro ao enviar relatório por email:', error);
      
      toast({
        title: "Erro ao enviar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante o envio do email.",
        variant: "destructive"
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2" data-tour="reports">
      <Button 
        onClick={generateCustomPDF}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
        size="sm"
      >
        <Download className="h-4 w-4" />
        Gerar Relatório PDF
      </Button>
      
      <Button 
        onClick={sendReportByEmail}
        disabled={isEmailLoading}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        size="sm"
      >
        <Mail className="h-4 w-4" />
        {isEmailLoading ? 'Enviando...' : 'Enviar por Email'}
      </Button>
    </div>
  );
}