import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
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
    const color = STAGE_COLORS[step.stage];
    
    if (status === 'completed') {
      return <CheckCircle2 className="w-4 h-4" style={{ color }} />;
    }
    if (status === 'current') {
      return <Circle className="w-4 h-4 fill-current" style={{ color }} />;
    }
    return <Circle className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />;
  };

  const handleStepClick = (step: StatusStep) => {
    if (readOnly) return;
    setSelectedStep(step);
    setIsPanelOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="h-full max-h-[75vh] overflow-hidden">
        {/* iOS-inspired Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{Math.round(progressPercent)}% completo</span>
                {slaInfo?.due_at && (
                  <Badge variant={slaInfo.isOverdue ? "destructive" : "secondary"} className="text-xs h-4 px-1.5">
                    {slaInfo.isOverdue ? 'Atrasado' : 'OK'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Progress Ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="100, 100"
                className="text-muted"
              />
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progressPercent}, 100`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        </div>

        {/* Current Status Card - iOS Style */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center gap-3">
            {steps[currentStepIndex] && (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                  {getStepIcon(steps[currentStepIndex], currentStepIndex)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Status Atual</div>
                  <div className="text-lg font-semibold text-primary">
                    {steps[currentStepIndex].label}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {steps[currentStepIndex].stage}
                  </Badge>
                </div>
                {!readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => handleStepClick(steps[currentStepIndex])}
                  >
                    Atualizar
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Steps List - iOS Style */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {steps.filter((_, i) => getStepStatus(i) === 'completed').length} Concluídas
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  {steps.filter((_, i) => getStepStatus(i) === 'pending').length} Pendentes
                </span>
              </div>
            </div>

            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const isClickable = !readOnly;
              
              return (
                <motion.div
                  key={step.key}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 bg-background/50",
                    status === 'completed' && "border-green-200/50 bg-green-50/30",
                    status === 'current' && "border-primary/30 bg-primary/5 ring-1 ring-primary/10",
                    status === 'pending' && "border-muted/50",
                    isClickable && "active:scale-[0.98] cursor-pointer"
                  )}
                  onClick={() => isClickable && handleStepClick(step)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      status === 'completed' && "border-green-500 bg-green-500 text-white shadow-sm",
                      status === 'current' && "border-primary bg-primary text-primary-foreground shadow-sm",
                      status === 'pending' && "border-muted-foreground/30 bg-background"
                    )}>
                      {getStepIcon(step, index)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {step.label}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={status === 'current' ? 'default' : 'outline'}
                        className="text-xs h-5"
                        style={status !== 'current' ? { 
                          borderColor: STAGE_COLORS[step.stage],
                          color: STAGE_COLORS[step.stage],
                          backgroundColor: `${STAGE_COLORS[step.stage]}08`
                        } : {}}
                      >
                        {step.stage}
                      </Badge>
                      {status === 'completed' && (
                        <span className="text-xs text-green-600 font-medium">✓ Concluída</span>
                      )}
                      {status === 'current' && (
                        <span className="text-xs text-primary font-medium">⏵ Atual</span>
                      )}
                    </div>
                  </div>

                  {/* History Indicator */}
                  {history.filter(h => h.to_status === step.key).length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-primary/40" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* SLA Warning */}
          {slaInfo?.isOverdue && (
            <div className="mx-4 mb-4">
              <motion.div 
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">
                  Ticket em atraso conforme SLA
                </span>
              </motion.div>
            </div>
          )}

          {/* Recent Activity - Compact */}
          {history.length > 0 && (
            <div className="border-t bg-muted/20">
              <div className="p-4 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Última Atividade</div>
                <div className="space-y-1">
                  {history.slice(-2).reverse().map((event) => (
                    <div key={event.id} className="flex items-center gap-2 p-2 bg-background/60 rounded-lg text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="font-medium">{event.to_status}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  ))}
                </div>
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