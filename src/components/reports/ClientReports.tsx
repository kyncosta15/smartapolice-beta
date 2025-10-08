import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientReportsProps {
  onExportComplete?: (fileName: string) => void;
  className?: string;
}

export function ClientReports({ onExportComplete, className }: ClientReportsProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!user?.id) return;

    setIsGenerating(true);
    try {
      // Buscar empresa do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('company')
        .eq('id', user.id)
        .single();

      if (!userData?.company) throw new Error('Empresa não encontrada');

      const { data: empresaData } = await supabase
        .from('empresas')
        .select('id, nome, cnpj')
        .eq('nome', userData.company)
        .single();

      if (!empresaData) throw new Error('Empresa não encontrada');

      const empresaId = empresaData.id;

      // Buscar dados em paralelo
      const [ticketsRes, veiculosRes, apolicesRes] = await Promise.all([
        supabase
          .from('tickets')
          .select(`
            *,
            vehicle:frota_veiculos(placa, marca, modelo)
          `)
          .eq('empresa_id', empresaId),
        
        supabase
          .from('frota_veiculos')
          .select('*')
          .eq('empresa_id', empresaId),
        
        supabase
          .from('apolices_beneficios')
          .select('*')
          .eq('empresa_id', empresaId)
      ]);

      const tickets = ticketsRes.data || [];
      const veiculos = veiculosRes.data || [];
      const apolices = apolicesRes.data || [];

      // Calcular estatísticas
      const sinistros = tickets.filter(t => t.tipo === 'sinistro');
      const assistencias = tickets.filter(t => t.tipo === 'assistencia');
      const veiculosSegurados = veiculos.filter(v => v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro');
      const veiculosSemSeguro = veiculos.filter(v => v.status_seguro === 'sem_seguro');

      // Distribuição por categoria
      const categorias = veiculos.reduce((acc, v) => {
        if (v.categoria) {
          acc[v.categoria] = (acc[v.categoria] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const categoriasOrdenadas = Object.entries(categorias)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Criar PDF com design executivo
      const pdf = new jsPDF();
      let yPos = 20;

      // === CAPA DO RELATÓRIO ===
      pdf.setFillColor(0, 72, 255); // Azul RCorp
      pdf.rect(0, 0, 210, 60, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Relatório Executivo', 105, 30, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Gestão de Frotas e Seguros', 105, 42, { align: 'center' });
      
      yPos = 75;

      // === INFORMAÇÕES DA EMPRESA ===
      pdf.setTextColor(51, 51, 51);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(empresaData.nome, 20, yPos);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102);
      yPos += 7;
      
      if (empresaData.cnpj) {
        pdf.text(`CNPJ: ${empresaData.cnpj}`, 20, yPos);
        yPos += 5;
      }
      
      pdf.text(`Data de geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, yPos);
      pdf.text(`Responsável: ${user.name || user.email}`, 20, yPos + 5);
      
      yPos += 20;

      // === KPIS PRINCIPAIS ===
      pdf.setFillColor(244, 246, 248);
      pdf.rect(15, yPos - 5, 180, 50, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text('INDICADORES PRINCIPAIS', 20, yPos);
      
      yPos += 10;

      // KPIs em grid
      const kpis = [
        { label: 'Total de Veiculos', value: veiculos.length, color: [0, 72, 255] },
        { label: 'Segurados', value: veiculosSegurados.length, color: [34, 197, 94] },
        { label: 'Sem Seguro', value: veiculosSemSeguro.length, color: [239, 68, 68] },
        { label: 'Sinistros', value: sinistros.length, color: [249, 115, 22] }
      ];

      const kpiWidth = 42;
      const kpiHeight = 25;
      let kpiX = 20;

      kpis.forEach((kpi, index) => {
        const [r, g, b] = kpi.color;
        pdf.setFillColor(r, g, b);
        pdf.rect(kpiX, yPos, kpiWidth, kpiHeight, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value.toString(), kpiX + kpiWidth / 2, yPos + 12, { align: 'center' });
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.label, kpiX + kpiWidth / 2, yPos + 19, { align: 'center' });
        
        kpiX += kpiWidth + 3;
      });

      yPos += kpiHeight + 20;

      // === INSIGHTS AUTOMÁTICOS ===
      const percentualSegurado = veiculos.length > 0 
        ? ((veiculosSegurados.length / veiculos.length) * 100).toFixed(1) 
        : '0.0';
      const categoriaPrincipal = categoriasOrdenadas[0];
      
      pdf.setFillColor(255, 243, 205);
      pdf.rect(15, yPos - 5, 180, 35, 'F');
      
      pdf.setFontSize(10);
      pdf.setTextColor(146, 64, 14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INSIGHTS', 20, yPos);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      yPos += 7;
      
      const insights = [
        `• ${percentualSegurado}% da frota esta coberta por seguro`,
        categoriaPrincipal ? `• ${categoriaPrincipal[0]} representa ${((categoriaPrincipal[1] / veiculos.length) * 100).toFixed(1)}% dos veiculos` : null,
        `• ${sinistros.filter(s => s.status === 'aberto').length} sinistros ativos necessitam acompanhamento`,
        `• ${assistencias.length} assistencias registradas no periodo`
      ].filter(Boolean);

      insights.forEach((insight) => {
        pdf.text(insight!, 25, yPos);
        yPos += 5;
      });

      yPos += 15;

      // === DISTRIBUIÇÃO POR CATEGORIA ===
      if (categoriasOrdenadas.length > 0) {
        if (yPos > 230) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setTextColor(51, 51, 51);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Distribuição por Categoria', 20, yPos);
        yPos += 10;

        autoTable(pdf, {
          startY: yPos,
          head: [['Categoria', 'Quantidade', 'Percentual']],
          body: categoriasOrdenadas.map(([nome, qtd]) => [
            nome,
            qtd.toString(),
            `${((qtd / veiculos.length) * 100).toFixed(1)}%`
          ]),
          theme: 'striped',
          headStyles: { 
            fillColor: [0, 72, 255],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // === SINISTROS E ASSISTÊNCIAS ===
      if (tickets.length > 0) {
        if (yPos > 230) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Últimos Sinistros e Assistências', 20, yPos);
        yPos += 10;

        const ticketsRecentes = tickets
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        autoTable(pdf, {
          startY: yPos,
          head: [['Protocolo', 'Tipo', 'Placa', 'Status', 'Data']],
          body: ticketsRecentes.map(t => [
            t.protocol_code || '-',
            t.tipo === 'sinistro' ? 'Sinistro' : 'Assistência',
            (t.vehicle as any)?.placa || '-',
            t.status || '-',
            format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ptBR })
          ]),
          theme: 'striped',
          headStyles: { 
            fillColor: [0, 72, 255],
            textColor: [255, 255, 255]
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 35 },
            4: { cellWidth: 35 }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // === GESTÃO DE FROTAS ===
      if (veiculos.length > 0) {
        if (yPos > 230) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Veículos da Frota', 20, yPos);
        yPos += 10;

        const veiculosTableData = veiculos.slice(0, 15).map(v => [
          v.placa || '-',
          `${v.marca || ''} ${v.modelo || ''}`.trim() || '-',
          v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro' ? 'Segurado' : 'Sem Seguro',
          v.categoria || '-'
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [['Placa', 'Modelo', 'Status', 'Categoria']],
          body: veiculosTableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [0, 72, 255],
            textColor: [255, 255, 255]
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 70 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // === APÓLICES DE BENEFÍCIOS ===
      if (apolices.length > 0) {
        if (yPos > 210) {
          pdf.addPage();
          yPos = 20;
        }

        // Cabeçalho da seção
        pdf.setTextColor(51, 51, 51);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Gestao de Apolices e Beneficios', 20, yPos);
        yPos += 15;

        // KPIs de Apólices
        const apolicesAtivas = apolices.filter(a => a.status === 'ativa');
        const apolicesCanceladas = apolices.filter(a => a.status === 'cancelada');
        const valorTotalApolices = apolices.reduce((sum, a) => sum + (parseFloat(String(a.valor_total || 0))), 0);
        const totalVidas = apolices.reduce((sum, a) => sum + (a.quantidade_vidas || 0), 0);

        const apolicesKpis = [
          { label: 'Total Apolices', value: apolices.length, color: [0, 72, 255] },
          { label: 'Ativas', value: apolicesAtivas.length, color: [34, 197, 94] },
          { label: 'Vidas', value: totalVidas, color: [249, 115, 22] },
          { label: 'Valor Total', value: `R$ ${(valorTotalApolices / 1000).toFixed(0)}k`, color: [168, 85, 247], isText: true }
        ];

        const apoliceKpiWidth = 42;
        const apoliceKpiHeight = 25;
        let apoliceKpiX = 20;

        apolicesKpis.forEach((kpi) => {
          const [r, g, b] = kpi.color;
          pdf.setFillColor(r, g, b);
          pdf.rect(apoliceKpiX, yPos, apoliceKpiWidth, apoliceKpiHeight, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(kpi.isText ? 14 : 18);
          pdf.setFont('helvetica', 'bold');
          pdf.text(String(kpi.value), apoliceKpiX + apoliceKpiWidth / 2, yPos + 12, { align: 'center' });
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(kpi.label, apoliceKpiX + apoliceKpiWidth / 2, yPos + 19, { align: 'center' });
          
          apoliceKpiX += apoliceKpiWidth + 3;
        });

        yPos += apoliceKpiHeight + 15;

        // Insights de Apólices
        const percentualAtivas = apolices.length > 0 
          ? ((apolicesAtivas.length / apolices.length) * 100).toFixed(1)
          : '0.0';
        
        // Agrupar por tipo de benefício
        const tiposBeneficios = apolices.reduce((acc, a) => {
          if (a.tipo_beneficio) {
            acc[a.tipo_beneficio] = (acc[a.tipo_beneficio] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const tipoPrincipal = Object.entries(tiposBeneficios)
          .sort(([, a], [, b]) => b - a)[0];

        pdf.setFillColor(255, 243, 205);
        pdf.rect(15, yPos - 5, 180, 30, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(146, 64, 14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('INSIGHTS - APOLICES', 20, yPos);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        yPos += 7;
        
        const apolicesInsights = [
          `• ${percentualAtivas}% das apolices estao ativas`,
          tipoPrincipal ? `• ${tipoPrincipal[0]} e o tipo de beneficio mais comum (${tipoPrincipal[1]} apolices)` : null,
          `• ${totalVidas} vidas cobertas no total`,
          valorTotalApolices > 0 ? `• Custo mensal total: R$ ${valorTotalApolices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null
        ].filter(Boolean);

        apolicesInsights.forEach((insight) => {
          pdf.text(insight!, 25, yPos);
          yPos += 5;
        });

        yPos += 10;

        // Tabela de apólices
        if (yPos > 220) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setTextColor(51, 51, 51);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detalhamento de Apolices', 20, yPos);
        yPos += 10;

        const apolicesTableData = apolices.map(a => [
          a.numero_apolice || '-',
          a.seguradora || '-',
          a.tipo_beneficio || '-',
          a.status || '-',
          a.inicio_vigencia ? format(new Date(a.inicio_vigencia), 'dd/MM/yyyy', { locale: ptBR }) : '-',
          a.fim_vigencia ? format(new Date(a.fim_vigencia), 'dd/MM/yyyy', { locale: ptBR }) : '-'
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [['Numero', 'Seguradora', 'Tipo', 'Status', 'Inicio', 'Fim']],
          body: apolicesTableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [0, 72, 255],
            textColor: [255, 255, 255]
          },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 28 },
            3: { cellWidth: 22 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // === RODAPÉ ===
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Linha separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, 285, 190, 285);
        
        // Rodapé
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${pageCount}`,
          20,
          290
        );
        pdf.text(
          'Gerado automaticamente pelo SmartApólice - RCORP Tecnologia',
          105,
          290,
          { align: 'center' }
        );
        pdf.text(
          format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          190,
          290,
          { align: 'right' }
        );
      }

      // Salvar PDF
      const fileName = `relatorio-executivo-${empresaData.nome.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      pdf.save(fileName);

      if (onExportComplete) {
        onExportComplete(fileName);
      }

      toast.success('Relatório executivo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </>
      )}
    </Button>
  );
}
