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
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (status === 'current') {
      return <Circle className="w-4 h-4 fill-current text-primary" />;
    }
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const handleStepClick = (step: StatusStep) => {
    if (readOnly) return;
    setSelectedStep(step);
    setIsPanelOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
              </h3>
              <div className="text-xs text-muted-foreground">{Math.round(progressPercent)}% completo</div>
            </div>
          </div>
          
          {/* Mini Progress Ring */}
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
              <circle 
                cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" 
                strokeDasharray={`${progressPercent * 0.628}, 62.8`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Current Status - Compact */}
        {steps[currentStepIndex] && (
          <div className="p-3 bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                {getStepIcon(steps[currentStepIndex], currentStepIndex)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{steps[currentStepIndex].label}</div>
                <Badge variant="secondary" className="text-xs h-4 px-1.5 mt-0.5">
                  {steps[currentStepIndex].stage}
                </Badge>
              </div>
              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleStepClick(steps[currentStepIndex])}
                >
                  Atualizar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Steps Timeline - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3 space-y-1 relative">
            {/* Timeline vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
            
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = !readOnly;
              const isLast = index === steps.length - 1;
              
              return (
                <motion.div
                  key={step.key}
                  className={cn(
                    "relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
                    status === 'completed' && "bg-green-50/50",
                    status === 'current' && "bg-primary/10 border border-primary/20",
                    status === 'pending' && "hover:bg-muted/30",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && handleStepClick(step)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Step indicator */}
                  <div className="relative z-10 flex items-center">
                    <div className="w-6 h-6 text-xs font-medium text-muted-foreground flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center ml-1 bg-background",
                      status === 'completed' && "border-green-500 bg-green-500",
                      status === 'current' && "border-primary bg-primary",
                      status === 'pending' && "border-muted-foreground/30"
                    )}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      ) : status === 'current' ? (
                        <Circle className="w-3 h-3 fill-current text-white" />
                      ) : (
                        <Circle className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{step.label}</span>
                      {status === 'completed' && (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                      {status === 'current' && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge 
                        variant="outline"
                        className="text-xs h-4 px-1.5"
                        style={{ 
                          borderColor: STAGE_COLORS[step.stage],
                          color: STAGE_COLORS[step.stage],
                          backgroundColor: `${STAGE_COLORS[step.stage]}10`
                        }}
                      >
                        {step.stage}
                      </Badge>
                      
                      {status === 'completed' && (
                        <span className="text-xs text-green-600">Concluída</span>
                      )}
                      {status === 'current' && (
                        <span className="text-xs text-primary font-medium">Em andamento</span>
                      )}
                    </div>
                  </div>

                  {/* Activity indicator */}
                  {history.filter(h => h.to_status === step.key).length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer with SLA and Activity */}
        <div className="border-t bg-muted/10">
          {/* SLA Warning */}
          {slaInfo?.isOverdue && (
            <div className="p-2 bg-destructive/5 border-b border-destructive/20">
              <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                <span className="text-destructive font-medium">Ticket em atraso</span>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {history.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Última atividade</div>
              <div className="space-y-1">
                {history.slice(-1).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-xs">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <span className="font-medium truncate">{event.to_status}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
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