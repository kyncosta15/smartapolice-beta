import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao SmartApólice! 🎉',
    description: 'Vamos te mostrar as principais funcionalidades do sistema de gestão de apólices mais inteligente do mercado.',
    target: 'body',
    position: 'center'
  },
  {
    id: 'logo',
    title: 'SmartApólice BETA',
    description: 'Sistema inovador para centralizar e gerenciar todas as suas apólices de seguro em um só lugar.',
    target: '[data-tour="logo"]',
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Dashboard Inteligente',
    description: 'Visualize métricas importantes, gráficos interativos e o resumo completo das suas apólices.',
    target: '[data-tour="dashboard"]',
    position: 'right'
  },
  {
    id: 'upload',
    title: 'Upload de PDFs',
    description: 'Faça upload dos PDFs das suas apólices e o sistema extrairá automaticamente todas as informações importantes.',
    target: '[data-tour="upload"]',
    position: 'right'
  },
  {
    id: 'reports',
    title: 'Relatórios Personalizados',
    description: 'Gere relatórios detalhados em PDF e envie por email. Perfeito para acompanhamento mensal.',
    target: '[data-tour="reports"]',
    position: 'left'
  },
  {
    id: 'charts',
    title: 'Análises Visuais',
    description: 'Gráficos intuitivos mostram distribuição por seguradora, tipos de seguro, status e evolução de custos.',
    target: '[data-tour="charts"]',
    position: 'top'
  },
  {
    id: 'profile',
    title: 'Configurações',
    description: 'Gerencie seu perfil, configurações do sistema e acesse funcionalidades administrativas.',
    target: '[data-tour="profile"]',
    position: 'left'
  },
  {
    id: 'finish',
    title: 'Pronto para começar! 🚀',
    description: 'Agora você conhece todas as funcionalidades principais. Comece fazendo upload da sua primeira apólice!',
    target: 'body',
    position: 'center',
    action: 'Começar a usar'
  }
];

interface InteractiveTourProps {
  isActive: boolean;
  onClose: () => void;
}

export function InteractiveTour({ isActive, onClose }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const step = tourSteps[currentStep];

  useEffect(() => {
    if (!isActive) return;

    const updateHighlight = () => {
      if (step.target === 'body') {
        setHighlightPosition({ top: 0, left: 0, width: 0, height: 0 });
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });
        
        // Scroll para o elemento se necessário
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [currentStep, isActive, step.target]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const base = {
      top: highlightPosition.top,
      left: highlightPosition.left
    };

    switch (step.position) {
      case 'top':
        return {
          ...base,
          top: base.top - 20,
          left: base.left + highlightPosition.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          ...base,
          top: base.top + highlightPosition.height + 20,
          left: base.left + highlightPosition.width / 2,
          transform: 'translate(-50%, 0%)'
        };
      case 'left':
        return {
          ...base,
          top: base.top + highlightPosition.height / 2,
          left: base.left - 20,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          ...base,
          top: base.top + highlightPosition.height / 2,
          left: base.left + highlightPosition.width + 20,
          transform: 'translate(0%, -50%)'
        };
      default:
        return base;
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
      >
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Highlight do elemento atual */}
        {step.target !== 'body' && highlightPosition.width > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bg-white rounded-md shadow-2xl"
            style={{
              top: highlightPosition.top,
              left: highlightPosition.left,
              width: highlightPosition.width,
              height: highlightPosition.height,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute z-10"
          style={getTooltipPosition()}
        >
          <Card className="w-80 max-w-[90vw] shadow-2xl border-0">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{currentStep + 1}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {currentStep + 1} de {tourSteps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTour}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Conteúdo */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 mb-6">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <motion.div
                    className="bg-blue-600 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <Button
                  onClick={nextStep}
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      <Play className="h-4 w-4" />
                      {step.action || 'Finalizar'}
                    </>
                  ) : (
                    <>
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Botão pular tour */}
              {currentStep < tourSteps.length - 1 && (
                <div className="text-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipTour}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Pular tour
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Componente para iniciar o tour
export function TourTrigger() {
  const [isTourActive, setIsTourActive] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsTourActive(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Play className="h-4 w-4" />
        Tour do Sistema
      </Button>
      
      <InteractiveTour
        isActive={isTourActive}
        onClose={() => setIsTourActive(false)}
      />
    </>
  );
}