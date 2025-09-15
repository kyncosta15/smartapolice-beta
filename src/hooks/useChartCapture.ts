import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export interface ChartImages {
  insurerDistribution?: string;
  typeDistribution?: string;
  statusDistribution?: string;
  monthlyEvolution?: string;
}

export function useChartCapture() {
  const captureElement = useCallback(async (selector: string): Promise<string | null> => {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(`Elemento não encontrado: ${selector}`);
        return null;
      }

      // Aguardar um pouco para garantir que o gráfico foi renderizado
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Para melhor qualidade
        logging: false,
        useCORS: true,
        allowTaint: true,
        height: element.offsetHeight,
        width: element.offsetWidth
      });

      return canvas.toDataURL('image/png', 0.9);
    } catch (error) {
      console.error(`Erro ao capturar elemento ${selector}:`, error);
      return null;
    }
  }, []);

  const captureCharts = useCallback(async (): Promise<ChartImages> => {
    console.log('🎯 Capturando gráficos do dashboard...');
    
    const images: ChartImages = {};

    // Aguardar um pouco para garantir que todos os gráficos foram renderizados
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Capturar diferentes tipos de gráfico baseado nos seletores dos componentes
      const selectors = [
        { key: 'insurerDistribution', selector: '[data-chart="insurer-distribution"]' },
        { key: 'typeDistribution', selector: '[data-chart="type-distribution"]' },
        { key: 'statusDistribution', selector: '[data-chart="status-distribution"]' },
        { key: 'monthlyEvolution', selector: '[data-chart="monthly-evolution"]' }
      ];

      // Tentar seletores alternativos se os específicos não existirem
      const fallbackSelectors = [
        { key: 'insurerDistribution', selector: '.recharts-wrapper' },
        { key: 'typeDistribution', selector: '.recharts-pie-chart' },
        { key: 'statusDistribution', selector: '.recharts-bar-chart' },
        { key: 'monthlyEvolution', selector: '.recharts-line-chart' }
      ];

      // Primeiro tentar os seletores específicos
      for (const { key, selector } of selectors) {
        const image = await captureElement(selector);
        if (image) {
          images[key as keyof ChartImages] = image;
          console.log(`✅ Gráfico capturado: ${key}`);
        }
      }

      // Se não encontrou nenhum gráfico, tentar os seletores de fallback
      if (Object.keys(images).length === 0) {
        console.log('⚠️ Tentando seletores de fallback...');
        
        for (const { key, selector } of fallbackSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            const image = await captureElement(selector);
            if (image) {
              images[key as keyof ChartImages] = image;
              console.log(`✅ Gráfico capturado via fallback: ${key}`);
            }
          }
        }
      }

      // Capturar o dashboard inteiro como fallback
      if (Object.keys(images).length === 0) {
        console.log('⚠️ Tentando capturar dashboard completo...');
        const dashboardImage = await captureElement('#dashboard-pdf-content');
        if (dashboardImage) {
          images.insurerDistribution = dashboardImage;
          console.log('✅ Dashboard completo capturado como fallback');
        }
      }

    } catch (error) {
      console.error('❌ Erro geral na captura de gráficos:', error);
    }

    console.log(`✅ Captura concluída: ${Object.keys(images).length} gráficos`);
    return images;
  }, [captureElement]);

  return {
    captureCharts,
    captureElement
  };
}