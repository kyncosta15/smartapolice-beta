import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { StatusStepperProps, StatusStep, STAGE_COLORS } from '@/types/status-stepper';
import { StatusHistoryPanel } from './StatusHistoryPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CompactStatusStepper: React.FC<StatusStepperProps> = ({
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
    
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4 text-white" />;
    }
    if (status === 'current') {
      return <Clock className="w-4 h-4 text-white" />;
    }
    return <Circle className="w-4 h-4 text-muted-foreground/60" />;
  };

  const handleStepClick = (step: StatusStep) => {
    if (readOnly) return;
    setSelectedStep(step);
    setIsPanelOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Compact Header - Mobile Optimized */}
        <div className="flex flex-col gap-2 p-3 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                {type === 'sinistro' ? (
                  <AlertCircle className="w-4 h-4 text-white" />
                ) : (
                  <Clock className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
                </h3>
                <div className="text-xs text-muted-foreground">
                  {Math.round(progressPercent)}% completo
                </div>
              </div>
            </div>
            
            {/* Progress Ring - Smaller on mobile */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="100, 100"
                  className="text-muted/20"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercent}, 100`}
                  className="text-primary drop-shadow-sm"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar for mobile */}
          <div className="w-full bg-muted/30 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Status - Mobile Optimized */}
        {steps[currentStepIndex] && (
          <div className="p-3 bg-gradient-to-r from-primary/8 to-primary/5 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-lg">
                {getStepIcon(steps[currentStepIndex], currentStepIndex)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">Status Atual</div>
                <div className="font-bold text-sm text-primary truncate">
                  {steps[currentStepIndex].label}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs h-5 px-2 bg-primary/10 text-primary border-primary/20"
                  >
                    {steps[currentStepIndex].stage}
                  </Badge>
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs ml-auto flex-shrink-0"
                      onClick={() => handleStepClick(steps[currentStepIndex])}
                    >
                      Atualizar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Steps Timeline - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 space-y-1 relative">
            {/* Timeline vertical line - More prominent */}
            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/10" />
            
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = !readOnly;
              
              return (
                <motion.div
                  key={step.key}
                  className={cn(
                    "relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 cursor-pointer",
                    status === 'completed' && "bg-gradient-to-r from-green-50 to-green-50/50 border border-green-200/50 shadow-sm",
                    status === 'current' && "bg-gradient-to-r from-primary/15 to-primary/8 border border-primary/30 shadow-md ring-1 ring-primary/20",
                    status === 'pending' && "bg-muted/20 hover:bg-muted/40 border border-transparent",
                    isClickable && "active:scale-[0.98]"
                  )}
                  onClick={() => isClickable && handleStepClick(step)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                >
                  {/* Enhanced Step indicators */}
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm",
                      status === 'completed' && "border-green-500 bg-gradient-to-br from-green-500 to-green-600",
                      status === 'current' && "border-primary bg-gradient-to-br from-primary to-primary/90 shadow-lg",
                      status === 'pending' && "border-muted-foreground/30 bg-background"
                    )}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : status === 'current' ? (
                        <Clock className="w-4 h-4 text-white animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>

                  {/* Enhanced Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-medium text-sm truncate",
                        status === 'completed' && "text-green-800",
                        status === 'current' && "text-primary font-semibold",
                        status === 'pending' && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      {status === 'completed' && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      )}
                      {status === 'current' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-xs h-5 px-2 border transition-colors",
                          status === 'completed' && "bg-green-50 border-green-300 text-green-700",
                          status === 'current' && "bg-primary/10 border-primary/30 text-primary font-medium",
                          status === 'pending' && "bg-muted/30 border-muted text-muted-foreground"
                        )}
                      >
                        {step.stage}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs">
                        {status === 'completed' && (
                          <span className="text-green-600 font-medium">Concluída</span>
                        )}
                        {status === 'current' && (
                          <span className="text-primary font-medium">Em andamento</span>
                        )}
                        {status === 'pending' && (
                          <span className="text-muted-foreground">Pendente</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Activity indicator with better visual */}
                  {history.filter(h => h.to_status === step.key).length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm pulse-dot" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer with SLA and Activity - Enhanced */}
        <div className="border-t bg-gradient-to-r from-muted/10 to-muted/5">
          {/* SLA Warning - Enhanced */}
          {slaInfo?.isOverdue && (
            <div className="p-3 bg-gradient-to-r from-red-50 to-red-50/50 border-b border-red-200/50">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                </div>
                <span className="text-red-700 font-medium">SLA em atraso</span>
              </div>
            </div>
          )}

          {/* Recent Activity - Enhanced */}
          {history.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Última Atividade
                </span>
              </div>
              <div className="space-y-1.5">
                {history.slice(-2).reverse().map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 bg-background/80 rounded-lg border border-muted/30">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-primary/80" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs truncate block">{event.to_status}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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