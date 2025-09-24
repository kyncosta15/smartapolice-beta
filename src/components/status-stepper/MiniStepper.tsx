import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { MiniStepperProps, STAGE_COLORS } from '@/types/status-stepper';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const MiniStepper: React.FC<MiniStepperProps> = ({
  type,
  currentStatus,
  steps,
  className
}) => {
  const currentStepIndex = steps.findIndex(step => step.key === currentStatus);
  const progressPercent = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  // Mostrar apenas alguns pontos chave para economizar espaço
  const keySteps = steps.filter((_, index) => {
    if (steps.length <= 5) return true;
    
    // Sempre mostrar primeiro, último e atual
    if (index === 0 || index === steps.length - 1 || index === currentStepIndex) return true;
    
    // Mostrar alguns pontos intermediários
    const interval = Math.ceil(steps.length / 4);
    return index % interval === 0;
  });

  const currentStep = steps[currentStepIndex];

  return (
    <div className={cn("bg-gradient-to-br from-card to-muted/10 border border-border/50 rounded-xl p-5 space-y-4 shadow-md backdrop-blur-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="text-sm font-bold text-foreground tracking-tight">
            {currentStep ? currentStep.label : 'Status não encontrado'}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{type === 'sinistro' ? 'Sinistro' : 'Assistência'}</span>
            <span>•</span>
            <span className="font-medium text-primary">Progresso: {Math.round(progressPercent)}%</span>
          </div>
        </div>
        {currentStep && (
          <Badge 
            variant="secondary"
            className="text-xs font-semibold shadow-sm"
            style={{ 
              backgroundColor: `${STAGE_COLORS[currentStep.stage]}20`,
              color: STAGE_COLORS[currentStep.stage],
              borderColor: `${STAGE_COLORS[currentStep.stage]}40`
            }}
          >
            {currentStep.stage}
          </Badge>
        )}
      </div>

      {/* Enhanced Progress Bar */}
      <div className="space-y-3">
        <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner border border-border/20">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-1000 ease-out shadow-sm relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        
        {/* Progress Points */}
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between">
            {keySteps.map((step, index) => {
              const originalIndex = steps.findIndex(s => s.key === step.key);
              const status = getStepStatus(originalIndex);
              const color = STAGE_COLORS[step.stage];
              const leftPosition = (originalIndex / (steps.length - 1)) * 100;
              
              return (
                <div
                  key={step.key}
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${leftPosition}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    "bg-background shadow-sm",
                    status === 'completed' && "border-primary",
                    status === 'current' && "border-primary ring-2 ring-primary/20",
                    status === 'pending' && "border-muted-foreground/30"
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="w-2.5 h-2.5" style={{ color }} />
                    ) : status === 'current' ? (
                      <Circle className="w-2.5 h-2.5 fill-current" style={{ color }} />
                    ) : (
                      <Circle className="w-2.5 h-2.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    )}
                  </div>
                  
                  {/* Label for current step on mobile */}
                  {status === 'current' && (
                    <div 
                      className="absolute top-5 text-xs font-medium whitespace-nowrap px-1 py-0.5 rounded text-center"
                      style={{ color }}
                    >
                      {step.label.length > 8 ? `${step.label.substring(0, 8)}...` : step.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};