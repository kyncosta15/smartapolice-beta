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
    <div className={cn("space-y-2", className)}>
      {/* Status Atual */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {currentStep ? currentStep.label : 'Status não encontrado'}
          </div>
          <div className="text-xs text-muted-foreground">
            Progresso: {Math.round(progressPercent)}%
          </div>
        </div>
        {currentStep && (
          <Badge 
            variant="outline"
            style={{ 
              borderColor: STAGE_COLORS[currentStep.stage],
              color: STAGE_COLORS[currentStep.stage]
            }}
          >
            {currentStep.stage}
          </Badge>
        )}
      </div>

      {/* Mini Progress Bar */}
      <div className="relative">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        {/* Pontos no progresso */}
        <div className="absolute inset-0 flex justify-between items-center">
          {keySteps.map((step, index) => {
            const originalIndex = steps.findIndex(s => s.key === step.key);
            const status = getStepStatus(originalIndex);
            const color = STAGE_COLORS[step.stage];
            
            return (
              <div
                key={step.key}
                className="relative"
                style={{ 
                  left: `${(originalIndex / (steps.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {status === 'completed' ? (
                  <CheckCircle2 
                    className="w-3 h-3 bg-background rounded-full" 
                    style={{ color }} 
                  />
                ) : status === 'current' ? (
                  <Circle 
                    className="w-3 h-3 fill-current bg-background rounded-full" 
                    style={{ color }} 
                  />
                ) : (
                  <Circle 
                    className="w-3 h-3 bg-background rounded-full" 
                    style={{ color: 'hsl(var(--muted-foreground))' }} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};