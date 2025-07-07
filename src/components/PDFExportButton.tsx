import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PDFExportButtonProps {
  targetElementId?: string;
  onExportComplete?: (fileName: string) => void;
}

export function PDFExportButton({ targetElementId = 'dashboard-pdf-content', onExportComplete }: PDFExportButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      // Primeiro, mostrar toast de loading
      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto o relatório é processado.",
      });

      // Aguardar um pouco para garantir que os gráficos estejam carregados
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Encontrar especificamente o conteúdo do dashboard pelo ID
      let targetElement = document.getElementById(targetElementId) as HTMLElement;
      
      console.log('🎯 PDFExportButton - Procurando elemento:', targetElementId);
      console.log('📍 Elemento encontrado pelo ID:', targetElement?.id, targetElement?.className);
      
      // Se não encontrar pelo ID, tentar o seletor específico do dashboard
      if (!targetElement) {
        console.log('⚠️ Elemento não encontrado pelo ID, tentando seletor direto');
        targetElement = document.querySelector('#dashboard-pdf-content') as HTMLElement;
        console.log('📍 Elemento encontrado por seletor:', targetElement?.id);
      }

      // Fallback para o conteúdo principal, removendo elementos indesejados
      if (!targetElement) {
        console.log('⚠️ Tentando fallback com print-container');
        const dashboardContent = document.querySelector('.print-container') as HTMLElement;
        if (dashboardContent) {
          targetElement = dashboardContent;
          console.log('📍 Elemento encontrado via print-container');
        }
      }

      // Último fallback: pegar o conteúdo principal do dashboard sem o header
      if (!targetElement) {
        console.log('⚠️ Último fallback: procurando conteúdo do dashboard');
        const allDashboardElements = document.querySelectorAll('.space-y-6');
        console.log('📊 Elementos .space-y-6 encontrados:', allDashboardElements.length);
        
        // Pegar o segundo elemento (primeiro é o container geral, segundo é o conteúdo)
        if (allDashboardElements.length > 1) {
          targetElement = allDashboardElements[1] as HTMLElement;
          console.log('📍 Usando segundo elemento .space-y-6');
        } else if (allDashboardElements.length === 1) {
          targetElement = allDashboardElements[0] as HTMLElement;
          console.log('📍 Usando primeiro elemento .space-y-6');
        }
      }

      console.log('✅ Elemento final selecionado:', {
        id: targetElement?.id,
        className: targetElement?.className,
        children: targetElement?.children.length,
        width: targetElement?.scrollWidth,
        height: targetElement?.scrollHeight
      });

      if (!targetElement) {
        throw new Error('Não foi possível encontrar o conteúdo do dashboard');
      }

      // Aguardar mais um tempo para garantir que todos os gráficos estejam totalmente renderizados
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Configurações para captura de alta qualidade
      const canvas = await html2canvas(targetElement, {
        scale: 2, // Qualidade otimizada
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Ativar logs para debug
        removeContainer: false,
        foreignObjectRendering: false, // Evitar problemas com elementos externos
        onclone: (clonedDoc, element) => {
          console.log('🖨️ Clonando documento para PDF...');
          
          // Garantir que todos os elementos estejam visíveis e bem formatados
          const clonedElement = element;
          
          console.log('📋 Elemento clonado:', {
            id: clonedElement.id,
            className: clonedElement.className,
            children: clonedElement.children.length
          });
          
          if (clonedElement) {
            // Aplicar estilos de impressão
            clonedElement.classList.add('print-container');
            
            // Forçar visibilidade e estilo de todos os elementos
            const allElements = clonedElement.querySelectorAll('*');
            console.log('📊 Total de elementos no clone:', allElements.length);
            
            allElements.forEach((el: any, index) => {
              if (el.style) {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
                el.style.backgroundColor = el.style.backgroundColor || 'white';
              }
              
              // Adicionar classes específicas para cards
              if (el.classList && (el.classList.contains('card') || el.tagName.toLowerCase() === 'div')) {
                el.classList.add('print-chart-card');
              }
            });

            // Garantir renderização correta dos gráficos recharts
            const charts = clonedElement.querySelectorAll('.recharts-wrapper, .recharts-surface');
            console.log('📈 Gráficos encontrados:', charts.length);
            
            charts.forEach((chart: any, index) => {
              console.log(`📈 Processando gráfico ${index + 1}`);
              if (chart.style) {
                chart.style.width = '100%';
                chart.style.height = 'auto';
                chart.style.minHeight = '300px';
                chart.style.backgroundColor = 'white';
              }
            });

            // Verificar se StatusEvolutionCharts está presente
            const statusCharts = clonedElement.querySelectorAll('.print-status-section, .print-status-charts');
            console.log('📊 Status charts encontrados:', statusCharts.length);
            
            statusCharts.forEach((statusChart: any) => {
              if (statusChart.style) {
                statusChart.style.display = 'block';
                statusChart.style.visibility = 'visible';
                statusChart.style.opacity = '1';
              }
            });
          }
        }
      });

      console.log('Canvas criado:', canvas.width, 'x', canvas.height);

      // Criar PDF otimizado
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm  
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Cabeçalho do relatório
      pdf.setFontSize(18);
      pdf.setTextColor(51, 51, 51);
      pdf.text('Relatório de Dashboard - SmartApólice', 20, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 20, 35);
      
      if (user?.name) {
        pdf.text(`Usuário: ${user.name}`, 20, 42);
      }
      
      // Adicionar linha separadora
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 48, 190, 48);
      
      // Posição inicial para o conteúdo
      let position = 55;
      let heightLeft = imgHeight;

      // Adicionar a primeira página
      pdf.addImage(
        canvas.toDataURL('image/png'), 
        'PNG', 
        0, 
        position, 
        imgWidth, 
        imgHeight
      );
      
      heightLeft -= (pageHeight - position);

      // Adicionar páginas extras se necessário
      while (heightLeft > 0) {
        pdf.addPage();
        position = -heightLeft + pageHeight;
        
        pdf.addImage(
          canvas.toDataURL('image/png'), 
          'PNG', 
          0, 
          position, 
          imgWidth, 
          imgHeight
        );
        
        heightLeft -= pageHeight;
      }

      // Salvar o arquivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const fileName = `dashboard-relatorio-${timestamp}.pdf`;
      
      pdf.save(fileName);

      // Notificar sobre a exportação completa
      if (onExportComplete) {
        onExportComplete(fileName);
      }

      // Toast de sucesso
      toast({
        title: "PDF gerado com sucesso!",
        description: `Arquivo ${fileName} foi baixado.`,
      });

    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante a geração do relatório.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={generatePDF}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      size="sm"
    >
      <Download className="h-4 w-4" />
      Exportar Dashboard
    </Button>
  );
}