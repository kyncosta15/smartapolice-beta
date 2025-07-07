
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { KPICards } from './dashboard/KPICards';
import { ClassificationCharts } from './dashboard/ClassificationCharts';
import { PersonTypeDistribution } from './dashboard/PersonTypeDistribution';
import { FinancialCharts } from './dashboard/FinancialCharts';
import { StatusEvolutionCharts } from './dashboard/StatusEvolutionCharts';
import { EmptyState } from './dashboard/EmptyState';
import { useDashboardCalculations } from './dashboard/useDashboardCalculations';
import { useRealDashboardData } from '@/hooks/useRealDashboardData';

interface DynamicDashboardProps {
  policies: ParsedPolicyData[];
  viewMode?: 'client' | 'admin';
}

export function DynamicDashboard({ policies, viewMode = 'client' }: DynamicDashboardProps) {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const dashboardData = useDashboardCalculations(policies);
  const { metrics: realMetrics, isLoading: realDataLoading } = useRealDashboardData();

  const generatePDF = async () => {
    if (!dashboardRef.current) return;

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

  // Para administradores, usar dados reais quando disponíveis
  const shouldUseRealData = viewMode === 'admin' && !realDataLoading;
  
  const displayMetrics = shouldUseRealData ? {
    totalPolicies: realMetrics.totalPolicies,
    totalMonthlyCost: realMetrics.monthlyPremium,
    totalInsuredValue: dashboardData.totalInsuredValue, // Manter calculado pois não temos no real
    expiringPolicies: dashboardData.expiringPolicies, // Manter calculado pois não temos no real
  } : {
    totalPolicies: dashboardData.totalPolicies,
    totalMonthlyCost: dashboardData.totalMonthlyCost,
    totalInsuredValue: dashboardData.totalInsuredValue,
    expiringPolicies: dashboardData.expiringPolicies,
  };

  if (policies.length === 0 && !shouldUseRealData) {
    return (
      <div className="space-y-6">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão para gerar PDF */}
      <div className="flex justify-end">
        <Button 
          onClick={generatePDF}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Exportar para PDF
        </Button>
      </div>

      {/* Container principal do dashboard */}
      <div ref={dashboardRef} className="space-y-6 bg-white p-6">
        {/* KPIs principais - com dados reais para admin */}
        <KPICards
          totalPolicies={displayMetrics.totalPolicies}
          totalMonthlyCost={displayMetrics.totalMonthlyCost}
          totalInsuredValue={displayMetrics.totalInsuredValue}
          expiringPolicies={displayMetrics.expiringPolicies}
        />

        {/* A. Classificação e identificação - Um embaixo do outro */}
        <ClassificationCharts
          typeDistribution={dashboardData.typeDistribution}
          insurerDistribution={dashboardData.insurerDistribution}
          recentPolicies={dashboardData.recentPolicies}
          colors={COLORS}
        />

        {/* Vínculo - Pessoa Física/Jurídica */}
        <PersonTypeDistribution
          personTypeDistribution={dashboardData.personTypeDistribution}
        />

        {/* C. Informações financeiras */}
        <FinancialCharts financialData={dashboardData.financialData} />

        {/* D. Gestão e ciclo de vida da apólice */}
        <StatusEvolutionCharts
          statusDistribution={dashboardData.statusDistribution}
          monthlyEvolution={dashboardData.monthlyEvolution}
          colors={COLORS}
        />
      </div>
    </div>
  );
}
