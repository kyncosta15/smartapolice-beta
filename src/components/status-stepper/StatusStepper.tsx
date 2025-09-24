import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { StatusStepperProps, StatusStep, STAGE_COLORS } from '@/types/status-stepper';
import { StatusHistoryPanel } from './StatusHistoryPanel';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const StatusStepper: React.FC<StatusStepperProps> = ({
  type,
  currentStatus,
  steps,
  history,
  onChangeStatus,
  readOnly = false,
  slaInfo
}) => {
  const [selectedStep, setSelectedStep] = useState<StatusStep | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const currentStepIndex = steps.findIndex(step => step.key === currentStatus);
  const progressPercent = currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: StatusStep, stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    const color = STAGE_COLORS[step.stage];
    
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4" style={{ color }} />;
    }
    if (status === 'current') {
      return <Circle className="w-4 h-4 fill-current" style={{ color }} />;
    }
    return <Circle className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />;
  };

  const getStepHistory = (stepKey: string) => {
    return history.filter(event => event.to_status === stepKey);
  };

  const formatTooltipContent = (step: StatusStep) => {
    const stepHistory = getStepHistory(step.key);
    const latestEvent = stepHistory[stepHistory.length - 1];
    
    if (!latestEvent) return step.label;
    
    return (
      <div className="text-sm">
        <div className="font-medium">{step.label}</div>
        <div className="text-xs mt-1">
          {format(new Date(latestEvent.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
        {latestEvent.user_name && (
          <div className="text-xs">Por: {latestEvent.user_name}</div>
        )}
      </div>
    );
  };

  const handleStepClick = (step: StatusStep) => {
    if (readOnly) return;
    setSelectedStep(step);
    setIsPanelOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {/* Progress Bar e SLA Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Progresso: {Math.round(progressPercent)}%
            </div>
            {slaInfo?.due_at && (
              <Badge variant={slaInfo.isOverdue ? "destructive" : "secondary"}>
                <Clock className="w-3 h-3 mr-1" />
                {slaInfo.isOverdue ? 'Atrasado' : 'No prazo'}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Desktop: Stepper Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
            <motion.div
              className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2"
              initial={{ width: 0 }}
              animate={{ 
                width: currentStepIndex >= 0 
                  ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
                  : '0%' 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = !readOnly;
              
              return (
                <Tooltip key={step.key}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "relative z-10 flex flex-col items-center gap-2 p-3 h-auto",
                        "bg-background border rounded-lg min-w-[120px]",
                        isClickable && "hover:bg-muted cursor-pointer",
                        status === 'current' && "ring-2 ring-primary"
                      )}
                      onClick={() => isClickable && handleStepClick(step)}
                      disabled={!isClickable}
                    >
                      <div className="flex items-center gap-2">
                        {getStepIcon(step, index)}
                        <span className="text-xs font-medium truncate max-w-[80px]">
                          {step.label}
                        </span>
                      </div>
                      
                      {/* Stage Badge */}
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: STAGE_COLORS[step.stage],
                          color: STAGE_COLORS[step.stage]
                        }}
                      >
                        {step.stage}
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatTooltipContent(step)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Mobile: Carrossel Horizontal */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = !readOnly;
              
              return (
                <Button
                  key={step.key}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-shrink-0 snap-center flex flex-col items-center gap-2 p-3 h-auto",
                    "bg-background border rounded-lg min-w-[100px]",
                    isClickable && "hover:bg-muted cursor-pointer",
                    status === 'current' && "ring-2 ring-primary"
                  )}
                  onClick={() => isClickable && handleStepClick(step)}
                  disabled={!isClickable}
                >
                  <div className="flex items-center gap-1">
                    {getStepIcon(step, index)}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {step.label}
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: STAGE_COLORS[step.stage],
                      color: STAGE_COLORS[step.stage]
                    }}
                  >
                    {step.stage}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {slaInfo?.isOverdue && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              Este ticket está atrasado conforme o SLA estabelecido
            </span>
          </div>
        )}

        {/* Status History Panel */}
        <StatusHistoryPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          selectedStep={selectedStep}
          history={history}
          onChangeStatus={onChangeStatus}
          readOnly={readOnly}
          currentStatus={currentStatus}
        />
      </div>
    </TooltipProvider>
  );
};