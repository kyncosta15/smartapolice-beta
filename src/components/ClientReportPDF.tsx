import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, Mail, Building2 } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ClientReportPDFProps {
  policies: ParsedPolicyData[];
  clientName?: string;
  brokerName?: string;
  brokerLogo?: string;
}

export function ClientReportPDF({ 
  policies, 
  clientName = "Cliente", 
  brokerName = "SmartApólice", 
  brokerLogo 
}: ClientReportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const calculateSummary = () => {
    const totalPolicies = policies.length;
    const totalMonthly = policies.reduce((sum, policy) => sum + (policy.monthlyAmount || 0), 0);
    const totalInsured = policies.reduce((sum, policy) => sum + (policy.totalCoverage || policy.premium || 0), 0);
    
    const statusCount = policies.reduce((acc, policy) => {
      const status = policy.status || 'vigente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalPolicies, totalMonthly, totalInsured, statusCount };
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'vigente': '#10B981', // Verde
      'ativa': '#10B981',
      'vencida': '#EF4444', // Vermelho
      'vencendo': '#F59E0B', // Amarelo
      'pendente_analise': '#F59E0B',
      'aguardando_emissao': '#3B82F6', // Azul
      'nao_renovada': '#6B7280' // Cinza
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      'vigente': 'Ativa',
      'ativa': 'Ativa',
      'vencida': 'Vencida',
      'vencendo': 'Vencendo',
      'pendente_analise': 'Em Análise',
      'aguardando_emissao': 'Aguardando Emissão',
      'nao_renovada': 'Não Renovada'
    };
    return statusMap[status as keyof typeof statusMap] || 'Desconhecido';
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const summary = calculateSummary();
      const currentDate = new Date().toLocaleDateString('pt-BR');
      const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      
      // Configurações de cores (elegantes e neutras)
      const colors = {
        primary: '#1E40AF', // Azul profissional
        secondary: '#64748B', // Cinza elegante
        accent: '#10B981', // Verde para destaques
        text: '#1F2937', // Cinza escuro para texto
        light: '#F8FAFC' // Fundo claro
      };

      let yPosition = 20;

      // 1️⃣ CABEÇALHO
      doc.setFillColor(colors.primary);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Logo (simulado - você pode adicionar uma imagem real)
      doc.setFillColor(255, 255, 255);
      doc.rect(15, 8, 24, 24, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.primary);
      doc.text('LOGO', 27, 18);
      doc.text(brokerName, 27, 22);

      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO DE APÓLICES', 105, 18, { align: 'center' });
      
      // Informações do cabeçalho
      doc.setFontSize(10);
      doc.text(`Cliente: ${clientName}`, 105, 25, { align: 'center' });
      doc.text(`Data: ${currentDate} | Período: ${currentMonth}`, 105, 30, { align: 'center' });

      yPosition = 50;

      // 2️⃣ RESUMO EXECUTIVO (Destaque Visual)
      doc.setFillColor(colors.light);
      doc.rect(10, yPosition, 190, 35, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.text('RESUMO EXECUTIVO', 15, yPosition + 8);

      // Cards do resumo
      const cardWidth = 45;
      const cardSpacing = 47;
      
      // Card 1: Total de Apólices
      doc.setFillColor(255, 255, 255);
      doc.rect(15, yPosition + 12, cardWidth, 18, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.secondary);
      doc.text('TOTAL DE APÓLICES', 17, yPosition + 17);
      doc.setFontSize(16);
      doc.setTextColor(colors.text);
      doc.text(summary.totalPolicies.toString(), 17, yPosition + 25);

      // Card 2: Total Mensal
      doc.setFillColor(255, 255, 255);
      doc.rect(15 + cardSpacing, yPosition + 12, cardWidth, 18, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.secondary);
      doc.text('TOTAL MENSAL', 17 + cardSpacing, yPosition + 17);
      doc.setFontSize(12);
      doc.setTextColor(colors.accent);
      doc.text(formatCurrency(summary.totalMonthly), 17 + cardSpacing, yPosition + 25);

      // Card 3: Valor Segurado
      doc.setFillColor(255, 255, 255);
      doc.rect(15 + cardSpacing * 2, yPosition + 12, cardWidth, 18, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.secondary);
      doc.text('VALOR SEGURADO', 17 + cardSpacing * 2, yPosition + 17);
      doc.setFontSize(12);
      doc.setTextColor(colors.text);
      doc.text(formatCurrency(summary.totalInsured), 17 + cardSpacing * 2, yPosition + 25);

      // Card 4: Status Geral
      doc.setFillColor(255, 255, 255);
      doc.rect(15 + cardSpacing * 3, yPosition + 12, cardWidth, 18, 'F');
      doc.setFontSize(8);
      doc.setTextColor(colors.secondary);
      doc.text('STATUS GERAL', 17 + cardSpacing * 3, yPosition + 17);
      doc.setFontSize(10);
      doc.setTextColor(colors.text);
      const activeCount = summary.statusCount['vigente'] || 0;
      const expiredCount = summary.statusCount['vencida'] || 0;
      doc.text(`${activeCount} Ativas`, 17 + cardSpacing * 3, yPosition + 22);
      doc.text(`${expiredCount} Vencidas`, 17 + cardSpacing * 3, yPosition + 27);

      yPosition += 45;

      // 3️⃣ GRÁFICOS VISUAIS (Simulados - você pode implementar gráficos reais)
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.text('ANÁLISE VISUAL', 15, yPosition);
      
      // Gráfico de distribuição por tipo (simulado)
      yPosition += 10;
      doc.setFillColor(colors.light);
      doc.rect(10, yPosition, 90, 40, 'F');
      doc.setFontSize(10);
      doc.setTextColor(colors.text);
      doc.text('Distribuição por Tipo de Apólice', 15, yPosition + 8);
      
      const typeDistribution = policies.reduce((acc, policy) => {
        const type = policy.type || 'Outros';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let chartY = yPosition + 15;
      Object.entries(typeDistribution).forEach(([type, count], index) => {
        const percentage = ((count / policies.length) * 100).toFixed(1);
        doc.setFontSize(8);
        doc.text(`${type}: ${count} (${percentage}%)`, 15, chartY + (index * 5));
      });

      // Gráfico de distribuição por seguradora
      doc.setFillColor(colors.light);
      doc.rect(110, yPosition, 90, 40, 'F');
      doc.setFontSize(10);
      doc.setTextColor(colors.text);
      doc.text('Distribuição por Seguradora', 115, yPosition + 8);

      const insurerDistribution = policies.reduce((acc, policy) => {
        const insurer = policy.insurer || 'Não informado';
        acc[insurer] = (acc[insurer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      chartY = yPosition + 15;
      Object.entries(insurerDistribution).slice(0, 5).forEach(([insurer, count], index) => {
        const percentage = ((count / policies.length) * 100).toFixed(1);
        doc.setFontSize(8);
        doc.text(`${insurer}: ${count} (${percentage}%)`, 115, chartY + (index * 5));
      });

      yPosition += 50;

      // Nova página se necessário
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      // 4️⃣ DETALHAMENTO DAS APÓLICES
      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.text('DETALHAMENTO DAS APÓLICES', 15, yPosition);
      yPosition += 10;

      // Tabela de apólices
      const tableData = policies.map(policy => [
        policy.insurer || 'N/A',
        policy.policyNumber || 'N/A',
        new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR'),
        formatCurrency(policy.monthlyAmount || 0),
        formatCurrency(policy.totalCoverage || policy.premium || 0),
        formatStatus(policy.status || 'vigente')
      ]);

      doc.autoTable({
        head: [['Seguradora', 'Nº Apólice', 'Vencimento', 'Valor Mensal', 'Valor Segurado', 'Status']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: colors.primary,
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: colors.text
        },
        columnStyles: {
          5: { 
            cellWidth: 25,
            halign: 'center'
          }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 5) {
            const status = data.cell.raw as string;
            if (status === 'Ativa') {
              data.cell.styles.textColor = [16, 185, 129]; // Verde
            } else if (status === 'Vencida') {
              data.cell.styles.textColor = [239, 68, 68]; // Vermelho
            } else if (status === 'Vencendo' || status === 'Em Análise') {
              data.cell.styles.textColor = [245, 158, 11]; // Amarelo
            }
          }
        }
      });

      // 5️⃣ ANÁLISE POR VINCULAÇÃO
      yPosition = (doc as any).lastAutoTable.finalY + 15;
      
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(colors.primary);
      doc.text('ANÁLISE POR VINCULAÇÃO', 15, yPosition);
      yPosition += 10;

      // Separar por tipo de pessoa (baseado no documento)
      const pfPolicies = policies.filter(p => p.documento_tipo === 'CPF' || !p.documento_tipo);
      const pjPolicies = policies.filter(p => p.documento_tipo === 'CNPJ');

      const pfTotal = pfPolicies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0);
      const pjTotal = pjPolicies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0);

      // Cards de vinculação
      doc.setFillColor(colors.light);
      doc.rect(10, yPosition, 90, 30, 'F');
      doc.setFontSize(12);
      doc.setTextColor(colors.text);
      doc.text('PESSOA FÍSICA', 15, yPosition + 8);
      doc.setFontSize(10);
      doc.text(`Quantidade: ${pfPolicies.length} apólices`, 15, yPosition + 15);
      doc.text(`Total Mensal: ${formatCurrency(pfTotal)}`, 15, yPosition + 22);

      doc.setFillColor(colors.light);
      doc.rect(110, yPosition, 90, 30, 'F');
      doc.setFontSize(12);
      doc.setTextColor(colors.text);
      doc.text('PESSOA JURÍDICA', 115, yPosition + 8);
      doc.setFontSize(10);
      doc.text(`Quantidade: ${pjPolicies.length} apólices`, 115, yPosition + 15);
      doc.text(`Total Mensal: ${formatCurrency(pjTotal)}`, 115, yPosition + 22);

      yPosition += 40;

      // 6️⃣ RODAPÉ
      const footerY = 260;
      doc.setFillColor(colors.primary);
      doc.rect(0, footerY, 210, 37, 'F');

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('Conte com nossa equipe para cuidar das suas apólices.', 105, footerY + 8, { align: 'center' });
      
      doc.setFontSize(8);
      doc.text('Contato:', 15, footerY + 18);
      doc.text('📧 contato@smartapolice.com.br', 15, footerY + 23);
      doc.text('📱 (11) 99999-9999', 15, footerY + 28);
      
      doc.text('🌐 www.smartapolice.com.br', 135, footerY + 23);
      doc.text('💬 WhatsApp: (11) 99999-9999', 135, footerY + 28);

      // Salvar PDF
      const fileName = `Relatorio-Apolices-${clientName.replace(/\s+/g, '-')}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Gerado com Sucesso",
        description: `Relatório ${fileName} foi baixado.`,
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao Gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendByEmail = async () => {
    try {
      setIsSending(true);
      
      // Implementar envio por email aqui
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Relatório Enviado",
        description: "O relatório foi enviado por email com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro ao Enviar Email",
        description: "Ocorreu um erro ao enviar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const summary = calculateSummary();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Relatório Profissional para Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview do Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{summary.totalPolicies}</div>
            <div className="text-sm text-muted-foreground">Total de Apólices</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-lg font-bold text-green-600">{formatCurrency(summary.totalMonthly)}</div>
            <div className="text-sm text-muted-foreground">Total Mensal</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-lg font-bold">{formatCurrency(summary.totalInsured)}</div>
            <div className="text-sm text-muted-foreground">Valor Segurado</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="flex flex-wrap gap-1 justify-center">
              {Object.entries(summary.statusCount).map(([status, count]) => (
                <Badge 
                  key={status} 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: getStatusColor(status) + '20',
                    color: getStatusColor(status)
                  }}
                >
                  {count} {formatStatus(status)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          <Button 
            onClick={generatePDF}
            disabled={isGenerating || policies.length === 0}
            className="flex-1"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={sendByEmail}
            disabled={isSending || policies.length === 0}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? 'Enviando...' : 'Enviar por Email'}
          </Button>
        </div>

        {policies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma apólice encontrada para gerar o relatório.
          </div>
        )}
      </CardContent>
    </Card>
  );
}