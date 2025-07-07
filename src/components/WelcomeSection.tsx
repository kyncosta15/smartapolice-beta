
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface WelcomeSectionProps {
  dashboardRef?: React.RefObject<HTMLDivElement>;
}

export function WelcomeSection({ dashboardRef }: WelcomeSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const generatePDF = async () => {
    if (!dashboardRef?.current) {
      toast({
        title: "Erro",
        description: "Não foi possível capturar o dashboard para exportação.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Gerando PDF...",
        description: "Aguarde enquanto o relatório é processado.",
      });

      // Capturar o elemento do dashboard
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, // Melhor qualidade
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Criar PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Adicionar título
      pdf.setFontSize(16);
      pdf.text('Relatório de Dashboard', 20, 20);
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      pdf.text(`Usuário: ${user?.name}`, 20, 35);
      
      position = 40;

      // Adicionar imagem
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas extras se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      const fileName = `dashboard-relatorio-${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF gerado com sucesso!",
        description: `Arquivo ${fileName} foi baixado.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro durante a geração do relatório.",
        variant: "destructive"
      });
    }
  };

  const getRoleMessage = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Você tem acesso total ao sistema de gestão de apólices.';
      case 'cliente':
        return 'Gerencie suas apólices de forma inteligente e segura.';
      case 'corretora':
        return 'Administre as apólices dos seus clientes de forma eficiente.';
      default:
        return 'Bem-vindo ao sistema de gestão de apólices.';
    }
  };

  console.log('WelcomeSection rendered with dashboardRef:', !!dashboardRef);

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo, {user?.name}!</h2>
          <p className="text-gray-600">{getRoleMessage(user?.role || '')}</p>
        </div>
        
        {/* Botão para gerar PDF */}
        <div className="ml-4">
          <Button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Exportar Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
