import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ClientReports() {
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

      // Criar PDF
      const pdf = new jsPDF();
      let yPos = 20;

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.setTextColor(34, 139, 34);
      pdf.text('Relatório Consolidado', 105, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(empresaData.nome, 105, yPos, { align: 'center' });
      
      if (empresaData.cnpj) {
        yPos += 6;
        pdf.text(`CNPJ: ${empresaData.cnpj}`, 105, yPos, { align: 'center' });
      }
      
      yPos += 6;
      pdf.text(`Data: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, yPos, { align: 'center' });
      
      yPos += 15;

      // Sumário Executivo
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Sumário Executivo', 20, yPos);
      yPos += 10;

      const summaryData = [
        ['Total de Veículos', veiculos.length.toString()],
        ['Veículos Segurados', veiculosSegurados.length.toString()],
        ['Veículos Sem Seguro', veiculosSemSeguro.length.toString()],
        ['Total de Sinistros', sinistros.length.toString()],
        ['Sinistros Abertos', sinistros.filter(s => s.status === 'aberto').length.toString()],
        ['Total de Assistências', assistencias.length.toString()],
        ['Assistências Abertas', assistencias.filter(a => a.status === 'aberto').length.toString()],
        ['Apólices Ativas', apolices.filter(a => a.status === 'ativa').length.toString()],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [['Indicador', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'center' }
        }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;

      // Sinistros e Assistências
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Sinistros e Assistências', 20, yPos);
      yPos += 10;

      const ticketsRecentes = tickets
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      if (ticketsRecentes.length > 0) {
        const ticketsTableData = ticketsRecentes.map(t => [
          t.protocol_code || '-',
          t.tipo === 'sinistro' ? 'Sinistro' : 'Assistência',
          (t.vehicle as any)?.placa || '-',
          t.status || '-',
          format(new Date(t.created_at), 'dd/MM/yyyy', { locale: ptBR })
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [['Protocolo', 'Tipo', 'Placa', 'Status', 'Data']],
          body: ticketsTableData,
          theme: 'grid',
          headStyles: { fillColor: [34, 139, 34] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // Gestão de Frotas
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Gestão de Frotas', 20, yPos);
      yPos += 10;

      if (veiculos.length > 0) {
        const veiculosTableData = veiculos.slice(0, 15).map(v => [
          v.placa || '-',
          `${v.marca || ''} ${v.modelo || ''}`.trim() || '-',
          v.status_seguro === 'segurado' || v.status_seguro === 'com_seguro' ? 'Segurado' : 'Sem Seguro',
          v.categoria || '-'
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [['Placa', 'Modelo', 'Status Seguro', 'Categoria']],
          body: veiculosTableData,
          theme: 'grid',
          headStyles: { fillColor: [34, 139, 34] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 70 },
            2: { cellWidth: 40 },
            3: { cellWidth: 35 }
          }
        });

        yPos = (pdf as any).lastAutoTable.finalY + 15;
      }

      // Apólices
      if (yPos > 250 || apolices.length > 0) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Apólices de Benefícios', 20, yPos);
      yPos += 10;

      if (apolices.length > 0) {
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
          head: [['Número', 'Seguradora', 'Tipo', 'Status', 'Início', 'Fim']],
          body: apolicesTableData,
          theme: 'grid',
          headStyles: { fillColor: [34, 139, 34] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
          }
        });
      }

      // Rodapé em todas as páginas
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Página ${i} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Salvar PDF
      const fileName = `relatorio-${empresaData.nome.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Relatórios
        </CardTitle>
        <CardDescription>
          Gere relatórios consolidados com informações de frotas, sinistros, assistências e apólices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Relatório Consolidado</h3>
              <p className="text-sm text-muted-foreground">
                Inclui gestão de frotas, sinistros, assistências e apólices
              </p>
            </div>
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
