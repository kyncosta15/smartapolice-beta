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

      // Aguardar mais tempo para garantir renderização completa dos gráficos
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Obter dimensões naturais do elemento
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Calcular dimensões reais considerando padding
      const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
      const paddingRight = parseInt(computedStyle.paddingRight) || 0;
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      
      const actualWidth = rect.width - paddingLeft - paddingRight;
      const actualHeight = rect.height - paddingTop - paddingBottom;

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Reduzir scale para evitar distorção
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        removeContainer: true,
        imageTimeout: 15000,
        width: Math.max(actualWidth, 400),
        height: Math.max(actualHeight, 300),
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      });

      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error(`Erro ao capturar elemento ${selector}:`, error);
      return null;
    }
  }, []);

  const captureCharts = useCallback(async (): Promise<ChartImages> => {
    console.log('🎯 Capturando gráficos do dashboard...');
    
    const images: ChartImages = {};

    // Aguardar mais tempo para garantir renderização completa
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Garantir que os gráficos estejam visíveis na viewport antes da captura
      const scrollToElement = (element: Element) => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      // Capturar diferentes tipos de gráfico baseado nos seletores dos componentes
      const selectors = [
        { key: 'insurerDistribution', selector: '[data-chart="insurer-distribution"]' },
        { key: 'typeDistribution', selector: '[data-chart="type-distribution"]' },
        { key: 'statusDistribution', selector: '[data-chart="status-distribution"]' },
        { key: 'monthlyEvolution', selector: '[data-chart="monthly-evolution"]' }
      ];

      // Tentar seletores alternativos se os específicos não existirem
      const fallbackSelectors = [
        { key: 'insurerDistribution', selector: '.recharts-wrapper:first-of-type' },
        { key: 'typeDistribution', selector: '.recharts-pie-chart:first-of-type' },
        { key: 'statusDistribution', selector: '.recharts-pie-chart:last-of-type' },
        { key: 'monthlyEvolution', selector: '.recharts-line-chart:first-of-type' }
      ];

      // Primeiro tentar os seletores específicos
      for (const { key, selector } of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Scroll para o elemento e aguardar
          scrollToElement(element);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const image = await captureElement(selector);
          if (image) {
            images[key as keyof ChartImages] = image;
            console.log(`✅ Gráfico capturado: ${key}`);
          }
        }
      }

      // Se não encontrou nenhum gráfico, tentar os seletores de fallback
      if (Object.keys(images).length === 0) {
        console.log('⚠️ Tentando seletores de fallback...');
        
        for (const { key, selector } of fallbackSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            scrollToElement(element);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const image = await captureElement(selector);
            if (image) {
              images[key as keyof ChartImages] = image;
              console.log(`✅ Gráfico capturado via fallback: ${key}`);
            }
          }
        }
      }

      // Capturar cards individuais dos gráficos se ainda não encontrou
      if (Object.keys(images).length === 0) {
        console.log('⚠️ Tentando capturar cards dos gráficos...');
        const chartCards = document.querySelectorAll('.print-chart-card');
        
        if (chartCards.length >= 2) {
          // Primeira card (geralmente insurer distribution)
          scrollToElement(chartCards[0]);
          await new Promise(resolve => setTimeout(resolve, 1000));
          const firstImage = await captureElement('.print-chart-card:first-of-type');
          if (firstImage) {
            images.insurerDistribution = firstImage;
            console.log('✅ Primeiro gráfico capturado via card');
          }

          // Segunda card (geralmente type distribution)
          scrollToElement(chartCards[1]);
          await new Promise(resolve => setTimeout(resolve, 1000));
          const secondImage = await captureElement('.print-chart-card:nth-of-type(2)');
          if (secondImage) {
            images.typeDistribution = secondImage;
            console.log('✅ Segundo gráfico capturado via card');
          }
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