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
      return <CheckCircle2 className="w-5 h-5" style={{ color }} />;
    }
    if (status === 'current') {
      return <Circle className="w-5 h-5 fill-current" style={{ color }} />;
    }
    return <Circle className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />;
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
      <div className="w-full bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Esteira de Status - {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Progresso: <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
              </div>
              {slaInfo?.due_at && (
                <Badge variant={slaInfo.isOverdue ? "destructive" : "secondary"}>
                  <Clock className="w-3 h-3 mr-1" />
                  {slaInfo.isOverdue ? 'Atrasado' : 'No prazo'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="space-y-2">
          <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Desktop: Enhanced Stepper */}
        <div className="hidden lg:block">
          <div className="relative px-8">
            {/* Steps Container */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isClickable = !readOnly;
                
                return (
                  <div key={step.key} className="relative flex flex-col items-center">
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <>
                        {/* Background line */}
                        <div className="absolute top-6 left-1/2 w-full h-0.5 bg-muted z-0" />
                        {/* Progress line */}
                        <motion.div
                          className="absolute top-6 left-1/2 h-0.5 bg-primary z-0"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: status === 'completed' ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                        />
                      </>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={cn(
                            "flex flex-col items-center space-y-3 cursor-pointer group relative z-10",
                            !isClickable && "cursor-default"
                          )}
                          onClick={() => isClickable && handleStepClick(step)}
                          whileHover={isClickable ? { scale: 1.02 } : {}}
                          whileTap={isClickable ? { scale: 0.98 } : {}}
                        >
                          {/* Icon Circle */}
                          <div className={cn(
                            "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative",
                            "bg-background shadow-sm",
                            status === 'completed' && "border-primary bg-primary text-primary-foreground",
                            status === 'current' && "border-primary bg-primary/10 ring-2 ring-primary/30",
                            status === 'pending' && "border-muted-foreground/30",
                            isClickable && "group-hover:border-primary/70 group-hover:shadow-md"
                          )}>
                            {getStepIcon(step, index)}
                          </div>
                          
                          {/* Step Info */}
                          <div className="text-center space-y-1 max-w-[100px]">
                            <div className={cn(
                              "text-xs font-medium leading-tight",
                              status === 'current' ? "text-primary" : "text-foreground"
                            )}>
                              {step.label}
                            </div>
                            <Badge 
                              variant={status === 'current' ? 'default' : 'outline'}
                              className="text-xs"
                              style={status !== 'current' ? { 
                                borderColor: STAGE_COLORS[step.stage],
                                color: STAGE_COLORS[step.stage]
                              } : {}}
                            >
                              {step.stage}
                            </Badge>
                          </div>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatTooltipContent(step)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tablet: Horizontal Scroll */}
        <div className="hidden md:block lg:hidden">
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory px-4">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isClickable = !readOnly;
                
                return (
                  <div key={step.key} className="relative flex-shrink-0 snap-center">
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <>
                        <div className="absolute top-6 -right-3 w-6 h-0.5 bg-muted z-0" />
                        {status === 'completed' && (
                          <motion.div
                            className="absolute top-6 -right-3 h-0.5 bg-primary z-0"
                            initial={{ width: 0 }}
                            animate={{ width: '24px' }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          />
                        )}
                      </>
                    )}
                    
                    <motion.div
                      className={cn(
                        "flex flex-col items-center space-y-3 p-3 rounded-lg border cursor-pointer min-w-[120px]",
                        "bg-background relative z-10",
                        status === 'completed' && "border-primary/30 bg-primary/5",
                        status === 'current' && "border-primary bg-primary/10 ring-1 ring-primary/30",
                        status === 'pending' && "border-muted",
                        isClickable && "hover:border-primary/50 hover:bg-primary/5"
                      )}
                      onClick={() => isClickable && handleStepClick(step)}
                      whileHover={isClickable ? { scale: 1.02 } : {}}
                      whileTap={isClickable ? { scale: 0.98 } : {}}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors",
                        status === 'completed' && "border-primary bg-primary text-primary-foreground",
                        status === 'current' && "border-primary bg-primary/10",
                        status === 'pending' && "border-muted-foreground/30"
                      )}>
                        {getStepIcon(step, index)}
                      </div>
                      <div className="text-center space-y-1">
                        <div className={cn(
                          "text-sm font-medium leading-tight",
                          status === 'current' && "text-primary"
                        )}>
                          {step.label}
                        </div>
                        <Badge 
                          variant={status === 'current' ? 'default' : 'outline'}
                          className="text-xs"
                          style={status !== 'current' ? { 
                            borderColor: STAGE_COLORS[step.stage],
                            color: STAGE_COLORS[step.stage]
                          } : {}}
                        >
                          {step.stage}
                        </Badge>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Compact Cards */}
        <div className="md:hidden">
          <div className="space-y-4">
            {/* Current Status Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-primary">
                    Status Atual
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {steps[currentStepIndex]?.label || 'Status não encontrado'}
                  </div>
                </div>
                {steps[currentStepIndex] && (
                  <Badge variant="default" className="text-xs">
                    {steps[currentStepIndex].stage}
                  </Badge>
                )}
              </div>
            </div>

            {/* Steps Scroll */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Todas as Etapas
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable = !readOnly;
                  
                  return (
                    <motion.div
                      key={step.key}
                      className={cn(
                        "flex-shrink-0 snap-center p-3 rounded-lg border cursor-pointer min-w-[90px]",
                        "bg-background",
                        status === 'completed' && "border-primary bg-primary/10",
                        status === 'current' && "border-primary bg-primary/15 ring-1 ring-primary/40",
                        status === 'pending' && "border-muted",
                        isClickable && "active:scale-95"
                      )}
                      onClick={() => isClickable && handleStepClick(step)}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                          status === 'completed' && "border-primary bg-primary text-primary-foreground",
                          status === 'current' && "border-primary bg-primary/20",
                          status === 'pending' && "border-muted-foreground/40"
                        )}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : status === 'current' ? (
                            <Circle className="w-4 h-4 fill-current" style={{ color: STAGE_COLORS[step.stage] }} />
                          ) : (
                            <Circle className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          )}
                        </div>
                        <div className={cn(
                          "text-xs font-medium text-center leading-tight",
                          status === 'current' && "text-primary"
                        )}>
                          {step.label.length > 10 ? `${step.label.substring(0, 10)}...` : step.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {slaInfo?.isOverdue && (
          <motion.div 
            className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">
              Este ticket está atrasado conforme o SLA estabelecido
            </span>
          </motion.div>
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