import React from 'react';
import { StatusStepperRCorp, ClaimsStatusStepper } from '@/components/ui-v2/status-stepper-rcorp';
import { TooltipRCorp } from '@/components/ui-v2/tooltip-rcorp';
import { useUIVersion } from '@/hooks/useUIVersion';
import { StatusStepper } from './StatusStepper';
import { MiniStepper } from './MiniStepper';
import type { StatusStepperProps, MiniStepperProps } from '@/types/status-stepper';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced StatusStepper with V2 UI integration
export function StatusStepperV2(props: StatusStepperProps) {
  const uiVersion = useUIVersion();
  
  if (uiVersion.useV2) {
    // Convert legacy format to new StatusStepperRCorp format
    const steps = props.steps.map(step => ({
      id: step.key,
      title: step.label,
      description: step.stage,
      status: getCurrentStepStatus(step.key, props.currentStatus, props.steps),
      date: getStepDate(step.key, props.history),
    }));

    return (
      <StatusStepperRCorp
        steps={steps}
        orientation="vertical"
        variant="detailed"
        showProgress={true}
        interactive={!props.readOnly}
        onStepClick={(stepId) => {
          const step = props.steps.find(s => s.key === stepId);
          if (step && props.onChangeStatus) {
            props.onChangeStatus(step.key);
          }
        }}
        size="md"
      />
    );
  }

  // Fallback to V1 component
  return <StatusStepper {...props} />;
}

// Enhanced MiniStepper with tooltips
export function MiniStepperV2(props: MiniStepperProps) {
  const uiVersion = useUIVersion();
  
  if (uiVersion.useV2) {
    const currentStepIndex = props.steps.findIndex(step => step.key === props.currentStatus);
    const progressPercent = currentStepIndex >= 0 ? ((currentStepIndex + 1) / props.steps.length) * 100 : 0;

    return (
      <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-background to-muted/20 rounded-lg border">
        {/* Mini progress indicator */}
        <div className="flex items-center gap-2 flex-1">
          {props.steps.map((step, index) => {
            const isCurrent = step.key === props.currentStatus;
            const isCompleted = index < currentStepIndex;
            const isPending = index > currentStepIndex;
            
            return (
              <TooltipRCorp
                key={step.key}
                content={
                  <div className="text-center">
                    <div className="font-medium">{step.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.stage}
                    </div>
                  </div>
                }
                placement="top"
              >
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  isCompleted && "bg-green-500 shadow-sm shadow-green-500/25",
                  isCurrent && "bg-blue-500 animate-pulse shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20",
                  isPending && "bg-muted-foreground/30"
                )} />
              </TooltipRCorp>
            );
          })}
        </div>

        {/* Current status badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={currentStepIndex >= 0 ? "default" : "outline"}
            className="text-xs font-medium"
          >
            <div className="flex items-center gap-1">
              {currentStepIndex === props.steps.length - 1 ? (
                <CheckCircle className="w-3 h-3" />
              ) : currentStepIndex >= 0 ? (
                <Clock className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {props.steps[currentStepIndex]?.label || 'Status não encontrado'}
            </div>
          </Badge>
          <div className="text-xs text-muted-foreground">
            {Math.round(progressPercent)}%
          </div>
        </div>
      </div>
    );
  }

  // Fallback to V1 component  
  return <MiniStepper {...props} />;
}

// Specialized Claims Status Timeline
export function ClaimsTimelineCard({
  claimId,
  claimType = 'sinistro',
  currentStatus,
  createdAt,
  events = [],
  className,
}: {
  claimId: string;
  claimType?: 'sinistro' | 'assistencia';
  currentStatus: string;
  createdAt?: string;
  events?: Array<{
    status: string;
    date: string;
    description?: string;
  }>;
  className?: string;
}) {
  const uiVersion = useUIVersion();

  if (!uiVersion.useV2) {
    return null; // Only available in V2
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            claimType === 'sinistro' ? "bg-red-500" : "bg-blue-500"
          )} />
          Timeline - {claimType === 'sinistro' ? 'Sinistro' : 'Assistência'}
          <Badge variant="outline" className="ml-auto text-xs">
            #{claimId}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClaimsStatusStepper
          currentStatus={currentStatus}
          claimType={claimType}
          createdAt={createdAt}
          events={events}
          orientation="vertical"
          variant="detailed"
          showProgress={true}
          size="md"
        />
      </CardContent>
    </Card>
  );
}

// Responsive Timeline for Mobile
export function MobileTimeline({
  steps,
  currentStatus,
}: {
  steps: Array<{
    key: string;
    label: string;
    stage: string;
  }>;
  currentStatus: string;
}) {
  const uiVersion = useUIVersion();
  const currentStepIndex = steps.findIndex(step => step.key === currentStatus);

  if (!uiVersion.useV2) {
    return null;
  }

  return (
    <div className="md:hidden">
      <Card className="bg-gradient-to-br from-background to-muted/20">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Current status highlight */}
            <div className="text-center space-y-2">
              <Badge className="px-3 py-1">
                Status Atual: {steps[currentStepIndex]?.label || 'Não encontrado'}
              </Badge>
              <div className="text-xs text-muted-foreground">
                Etapa {currentStepIndex + 1} de {steps.length}
              </div>
            </div>

            {/* Horizontal mini stepper */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, index) => (
                <TooltipRCorp
                  key={step.key}
                  content={step.label}
                  placement="top"
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full transition-all duration-300 border-2",
                    index < currentStepIndex && "bg-green-500 border-green-500",
                    index === currentStepIndex && "bg-blue-500 border-blue-500 animate-pulse",
                    index > currentStepIndex && "bg-muted border-muted-foreground/30"
                  )} />
                </TooltipRCorp>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getCurrentStepStatus(stepKey: string, currentStatus: string, steps: any[]): any {
  const stepIndex = steps.findIndex(step => step.key === stepKey);
  const currentIndex = steps.findIndex(step => step.key === currentStatus);
  
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

function getStepDate(stepKey: string, history: any[] = []): string | undefined {
  const event = history.find(h => h.to_status === stepKey);
  return event?.created_at;
}