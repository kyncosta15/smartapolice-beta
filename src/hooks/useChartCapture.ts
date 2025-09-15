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

      // Garantir que o elemento está visível
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Aguardar renderização completa
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Obter dimensões reais do elemento
      const rect = element.getBoundingClientRect();
      
      console.log(`Capturando ${selector}:`, {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      });

      const canvas = await html2canvas(element, {
        backgroundColor: null, // Não forçar cor de fundo
        scale: 2, // Maior qualidade
        logging: true,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 30000,
        width: rect.width,
        height: rect.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        onclone: (clonedDoc) => {
          // Garantir que estilos CSS sejam aplicados no clone
          const clonedElement = clonedDoc.querySelector(selector) as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.animation = 'none';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log(`✅ Captura bem-sucedida para ${selector}`);
      
      return dataUrl;
    } catch (error) {
      console.error(`Erro ao capturar elemento ${selector}:`, error);
      return null;
    }
  }, []);

  const captureCharts = useCallback(async (): Promise<ChartImages> => {
    console.log('🎯 Capturando gráficos do dashboard...');
    
    const images: ChartImages = {};

    try {
      // Aguardar carregamento inicial
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Lista de seletores para tentar capturar na ordem de prioridade
      const chartSelectors = [
        { 
          key: 'insurerDistribution', 
          selectors: [
            '[data-chart="insurer-distribution"]',
            '[data-chart="insurer-distribution"] .recharts-wrapper',
            '.print-chart-card:has([data-chart="insurer-distribution"])'
          ]
        },
        { 
          key: 'typeDistribution', 
          selectors: [
            '[data-chart="type-distribution"]',
            '[data-chart="type-distribution"] .recharts-wrapper',
            '.print-chart-card:has([data-chart="type-distribution"])'
          ]
        },
        { 
          key: 'statusDistribution', 
          selectors: [
            '[data-chart="status-distribution"]',
            '[data-chart="status-distribution"] .recharts-wrapper',
            '.print-chart-card:has([data-chart="status-distribution"])'
          ]
        },
        { 
          key: 'monthlyEvolution', 
          selectors: [
            '[data-chart="monthly-evolution"]',
            '[data-chart="monthly-evolution"] .recharts-wrapper',
            '.print-chart-card:has([data-chart="monthly-evolution"])'
          ]
        }
      ];

      // Tentar capturar cada gráfico individualmente
      for (const chart of chartSelectors) {
        let captured = false;
        
        for (const selector of chart.selectors) {
          if (captured) break;
          
          const element = document.querySelector(selector) as HTMLElement;
          if (element && element.offsetHeight > 0 && element.offsetWidth > 0) {
            console.log(`Tentando capturar ${chart.key} com seletor: ${selector}`);
            
            // Scroll para garantir visibilidade
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const image = await captureElement(selector);
            if (image && image !== 'data:,' && !image.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) {
              images[chart.key as keyof ChartImages] = image;
              console.log(`✅ ${chart.key} capturado com sucesso`);
              captured = true;
            }
          }
        }
        
        if (!captured) {
          console.warn(`⚠️ Não foi possível capturar ${chart.key}`);
        }
      }

      // Fallback: tentar capturar qualquer gráfico Recharts visível
      if (Object.keys(images).length === 0) {
        console.log('🔄 Tentativa fallback: capturando qualquer gráfico visível...');
        
        const rechartElements = document.querySelectorAll('.recharts-wrapper');
        for (let i = 0; i < Math.min(rechartElements.length, 4); i++) {
          const element = rechartElements[i] as HTMLElement;
          if (element && element.offsetHeight > 100 && element.offsetWidth > 100) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const image = await captureElement(`.recharts-wrapper:nth-of-type(${i + 1})`);
            if (image) {
              const keys = ['insurerDistribution', 'typeDistribution', 'statusDistribution', 'monthlyEvolution'];
              const key = keys[i] as keyof ChartImages;
              if (key) {
                images[key] = image;
                console.log(`✅ Fallback: gráfico ${i + 1} capturado como ${key}`);
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro geral na captura de gráficos:', error);
    }

    const capturedCount = Object.keys(images).length;
    console.log(`✅ Captura concluída: ${capturedCount} gráfico(s) capturado(s)`);
    
    if (capturedCount === 0) {
      console.warn('⚠️ Nenhum gráfico foi capturado. Verifique se os gráficos estão visíveis na tela.');
    }

    return images;
  }, [captureElement]);

  return {
    captureCharts,
    captureElement
  };
}