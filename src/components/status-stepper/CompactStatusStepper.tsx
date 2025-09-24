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
      <div className="h-full">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-4 p-1">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
                {slaInfo?.due_at && (
                  <Badge variant={slaInfo.isOverdue ? "destructive" : "secondary"} className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {slaInfo.isOverdue ? 'Atrasado' : 'OK'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Current Status Highlight */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-sm font-medium text-primary mb-2">Status Atual</div>
            <div className="flex items-center gap-3">
              {steps[currentStepIndex] && (
                <>
                  <div className="w-8 h-8 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    {getStepIcon(steps[currentStepIndex], currentStepIndex)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {steps[currentStepIndex].label}
                    </div>
                    <Badge className="text-xs mt-1">
                      {steps[currentStepIndex].stage}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* All Steps List */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground px-1">
              Todas as Etapas ({steps.length})
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isClickable = !readOnly;
                
                return (
                  <motion.div
                    key={step.key}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                      status === 'completed' && "border-green-200 bg-green-50/50",
                      status === 'current' && "border-primary bg-primary/5 ring-1 ring-primary/20",
                      status === 'pending' && "border-muted bg-background",
                      isClickable && "active:scale-[0.98]"
                    )}
                    onClick={() => isClickable && handleStepClick(step)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      status === 'completed' && "border-green-500 bg-green-500 text-white",
                      status === 'current' && "border-primary bg-primary text-primary-foreground",
                      status === 'pending' && "border-muted-foreground/30 bg-background"
                    )}>
                      {getStepIcon(step, index)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {step.label}
                      </div>
                      <Badge 
                        variant={status === 'current' ? 'default' : 'outline'}
                        className="text-xs mt-1"
                        style={status !== 'current' ? { 
                          borderColor: STAGE_COLORS[step.stage],
                          color: STAGE_COLORS[step.stage],
                          backgroundColor: `${STAGE_COLORS[step.stage]}10`
                        } : {}}
                      >
                        {step.stage}
                      </Badge>
                    </div>

                    {/* Step indicator */}
                    <div className="text-xs text-muted-foreground font-mono">
                      {index + 1}/{steps.length}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-600">
                {steps.filter((_, i) => getStepStatus(i) === 'completed').length}
              </div>
              <div className="text-xs text-green-600">Concluídas</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-blue-600">1</div>
              <div className="text-xs text-blue-600">Atual</div>
            </div>
            <div className="bg-muted/50 border rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-muted-foreground">
                {steps.filter((_, i) => getStepStatus(i) === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
          </div>

          {slaInfo?.isOverdue && (
            <motion.div 
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">
                Ticket atrasado conforme SLA
              </span>
            </motion.div>
          )}
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column - Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {type === 'sinistro' ? 'Sinistro' : 'Assistência'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium text-primary">{Math.round(progressPercent)}%</span>
                  {slaInfo?.due_at && (
                    <Badge variant={slaInfo.isOverdue ? "destructive" : "secondary"} className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {slaInfo.isOverdue ? 'Atrasado' : 'No prazo'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* Compact Stepper */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isClickable = !readOnly;
                
                return (
                  <motion.div
                    key={step.key}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                      "hover:bg-muted/50",
                      status === 'completed' && "border-green-200 bg-green-50/50",
                      status === 'current' && "border-primary bg-primary/5 ring-1 ring-primary/20",
                      status === 'pending' && "border-muted bg-background",
                      isClickable && "cursor-pointer hover:border-primary/50"
                    )}
                    onClick={() => isClickable && handleStepClick(step)}
                    whileHover={isClickable ? { x: 4 } : {}}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      status === 'completed' && "border-green-500 bg-green-500 text-white",
                      status === 'current' && "border-primary bg-primary text-primary-foreground",
                      status === 'pending' && "border-muted-foreground/30 bg-background"
                    )}>
                      {getStepIcon(step, index)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className={cn(
                            "font-medium text-sm",
                            status === 'current' && "text-primary",
                            status === 'completed' && "text-green-700"
                          )}>
                            {step.label}
                          </div>
                          <Badge 
                            variant={status === 'current' ? 'default' : 'outline'}
                            className="text-xs"
                            style={status !== 'current' ? { 
                              borderColor: STAGE_COLORS[step.stage],
                              color: STAGE_COLORS[step.stage],
                              backgroundColor: `${STAGE_COLORS[step.stage]}10`
                            } : {}}
                          >
                            {step.stage}
                          </Badge>
                        </div>
                        {isClickable && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {slaInfo?.isOverdue && (
              <motion.div 
                className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm text-destructive">
                  Este ticket está atrasado conforme o SLA
                </span>
              </motion.div>
            )}
          </div>

          {/* Right Column - Current Status & Quick Actions */}
          <div className="space-y-4">
            {/* Current Status Card */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="space-y-3">
                <div className="text-sm font-medium text-primary">Status Atual</div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    {steps[currentStepIndex]?.label || 'Status não encontrado'}
                  </div>
                  {steps[currentStepIndex] && (
                    <Badge className="text-xs">
                      {steps[currentStepIndex].stage}
                    </Badge>
                  )}
                </div>
                {steps[currentStepIndex] && !readOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => handleStepClick(steps[currentStepIndex])}
                  >
                    Atualizar Status
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {steps.filter((_, i) => getStepStatus(i) === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Concluídas</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-muted-foreground">
                  {steps.filter((_, i) => getStepStatus(i) === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Pendentes</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Atividade Recente</div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {history.slice(-3).reverse().map((event, index) => (
                  <div key={event.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="font-medium">{event.to_status}</div>
                      {event.note && (
                        <div className="text-muted-foreground truncate">{event.note}</div>
                      )}
                      <div className="text-muted-foreground">
                        {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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