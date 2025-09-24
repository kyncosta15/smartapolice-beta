import React from 'react';
import { TooltipRCorp, StatusTooltip } from './tooltip-rcorp';
import { CheckCircle, Circle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'current' | 'completed' | 'error' | 'skipped';

export interface StepData {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
  date?: string;
  details?: string;
  subSteps?: Omit<StepData, 'subSteps'>[];
}

export interface StatusStepperRCorpProps {
  steps: StepData[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'minimal' | 'detailed';
  showProgress?: boolean;
  interactive?: boolean;
  onStepClick?: (stepId: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusIcons = {
  pending: Circle,
  current: Clock,
  completed: CheckCircle,
  error: XCircle,
  skipped: AlertTriangle,
};

const statusColors = {
  pending: 'text-muted-foreground border-muted-foreground/30 bg-background',
  current: 'text-blue-600 border-blue-600 bg-blue-50 animate-pulse',
  completed: 'text-green-600 border-green-600 bg-green-50',
  error: 'text-red-600 border-red-600 bg-red-50',
  skipped: 'text-amber-600 border-amber-600 bg-amber-50',
};

const connectorsColors = {
  pending: 'bg-muted-foreground/30',
  current: 'bg-blue-600',
  completed: 'bg-green-600',
  error: 'bg-red-600',
  skipped: 'bg-amber-600',
};

export function StatusStepperRCorp({
  steps,
  orientation = 'vertical',
  variant = 'default',
  showProgress = true,
  interactive = false,
  onStepClick,
  className,
  size = 'md',
}: StatusStepperRCorpProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      connector: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
      spacing: orientation === 'horizontal' ? 'gap-4' : 'gap-2',
    },
    md: {
      icon: 'w-8 h-8',
      connector: orientation === 'horizontal' ? 'h-1' : 'w-1',
      spacing: orientation === 'horizontal' ? 'gap-6' : 'gap-4',
    },
    lg: {
      icon: 'w-10 h-10',
      connector: orientation === 'horizontal' ? 'h-1.5' : 'w-1.5',
      spacing: orientation === 'horizontal' ? 'gap-8' : 'gap-6',
    },
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const renderStepIcon = (step: StepData) => {
    const IconComponent = statusIcons[step.status];
    
    return (
      <div
        className={cn(
          "rounded-full border-2 flex items-center justify-center transition-all duration-300",
          sizeClasses[size].icon,
          statusColors[step.status],
          interactive && onStepClick && "cursor-pointer hover:scale-110 hover:shadow-md"
        )}
        onClick={() => interactive && onStepClick?.(step.id)}
      >
        <IconComponent className={cn(
          "transition-all duration-200",
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      </div>
    );
  };

  const renderStepContent = (step: StepData, index: number) => {
    const tooltipContent = (
      <div className="space-y-2 max-w-sm">
        <div className="font-medium">{step.title}</div>
        {step.description && (
          <div className="text-sm text-muted-foreground">{step.description}</div>
        )}
        {step.date && (
          <div className="text-xs text-muted-foreground">
            <strong>Data:</strong> {step.date}
          </div>
        )}
        {step.details && (
          <div className="text-xs text-muted-foreground">{step.details}</div>
        )}
        {step.subSteps && step.subSteps.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="text-xs font-medium mb-1">Sub-etapas:</div>
            <ul className="space-y-1">
              {step.subSteps.map((subStep) => (
                <li key={subStep.id} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    statusColors[subStep.status].split(' ')[0] + ' ' + 
                    connectorsColors[subStep.status]
                  )} />
                  <span>{subStep.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    return (
      <StatusTooltip
        key={step.id}
        content={tooltipContent as any}
        status={step.status === 'completed' ? 'success' : 
               step.status === 'error' ? 'error' :
               step.status === 'current' ? 'info' : 'info'}
        placement={orientation === 'horizontal' ? 'top' : 'right'}
      >
        <div className={cn(
          "flex items-center transition-all duration-300",
          orientation === 'horizontal' ? 'flex-col text-center' : 'flex-row',
          sizeClasses[size].spacing
        )}>
          {renderStepIcon(step)}
          
          {variant !== 'minimal' && (
            <div className={cn(
              "select-none",
              orientation === 'horizontal' ? 'mt-2' : 'ml-3'
            )}>
              <div className={cn(
                "font-medium transition-colors duration-200",
                step.status === 'completed' ? 'text-green-700' :
                step.status === 'current' ? 'text-blue-700' :
                step.status === 'error' ? 'text-red-700' :
                'text-muted-foreground',
                size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
              )}>
                {step.title}
              </div>
              
              {variant === 'detailed' && step.description && (
                <div className={cn(
                  "text-muted-foreground mt-1",
                  size === 'sm' ? 'text-xs' : 'text-sm'
                )}>
                  {step.description}
                </div>
              )}
              
              {variant === 'detailed' && step.date && (
                <div className={cn(
                  "text-muted-foreground mt-1 font-mono",
                  size === 'sm' ? 'text-xs' : 'text-xs'
                )}>
                  {step.date}
                </div>
              )}
            </div>
          )}
        </div>
      </StatusTooltip>
    );
  };

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;
    
    const currentStep = steps[index];
    const isActive = currentStep.status === 'completed' || currentStep.status === 'current';
    
    return (
      <div className={cn(
        "transition-all duration-300",
        orientation === 'horizontal' ? 
          `flex-1 ${sizeClasses[size].connector} mx-2` : 
          `${sizeClasses[size].connector} h-8 my-2 ml-4`,
        isActive ? connectorsColors.completed : connectorsColors.pending
      )} />
    );
  };

  return (
    <div className={cn(
      "relative",
      orientation === 'horizontal' ? 'flex items-center w-full' : 'flex flex-col',
      className
    )}>
      {/* Progress bar (only for horizontal orientation) */}
      {showProgress && orientation === 'horizontal' && (
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted-foreground/20 rounded-full">
          <div 
            className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Steps */}
      {orientation === 'horizontal' ? (
        <div className="flex items-center justify-between w-full relative z-10">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {renderStepContent(step, index)}
              {renderConnector(index)}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="space-y-0">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {renderStepContent(step, index)}
              {renderConnector(index)}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Progress summary (for vertical orientation) */}
      {showProgress && orientation === 'vertical' && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{completedSteps}/{steps.length} concluídas</span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Specialized stepper for claims/tickets status flow
export function ClaimsStatusStepper({
  currentStatus,
  claimType = 'sinistro',
  createdAt,
  events = [],
  ...props
}: Omit<StatusStepperRCorpProps, 'steps'> & {
  currentStatus: string;
  claimType?: 'sinistro' | 'assistencia';
  createdAt?: string;
  events?: Array<{
    status: string;
    date: string;
    description?: string;
  }>;
}) {
  const getStepStatus = (stepStatus: string): StepStatus => {
    if (stepStatus === currentStatus) return 'current';
    
    // Define the order of statuses for each type
    const statusOrder = claimType === 'sinistro' 
      ? ['aberto', 'em_analise', 'em_regulacao', 'finalizado']
      : ['aberto', 'em_andamento', 'finalizado'];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepIndex < currentIndex) return 'completed';
    return 'pending';
  };

  const steps: StepData[] = claimType === 'sinistro' ? [
    {
      id: 'aberto',
      title: 'Abertura',
      description: 'Ticket criado e registrado',
      status: getStepStatus('aberto'),
      date: createdAt,
      details: 'Sinistro reportado e documentação inicial coletada',
    },
    {
      id: 'em_analise',
      title: 'Em Análise',
      description: 'Documentação sendo verificada',
      status: getStepStatus('em_analise'),
      date: events.find(e => e.status === 'em_analise')?.date,
      details: 'Equipe técnica analisa documentos e evidências',
    },
    {
      id: 'em_regulacao',
      title: 'Em Regulação',
      description: 'Avaliação técnica em andamento',
      status: getStepStatus('em_regulacao'),
      date: events.find(e => e.status === 'em_regulacao')?.date,
      details: 'Perito avalia danos e define valor da indenização',
    },
    {
      id: 'finalizado',
      title: 'Finalizado',
      description: 'Processo concluído',
      status: getStepStatus('finalizado'),
      date: events.find(e => e.status === 'finalizado')?.date,
      details: 'Indenização paga ou processo encerrado',
    },
  ] : [
    {
      id: 'aberto',
      title: 'Abertura',
      description: 'Assistência solicitada',
      status: getStepStatus('aberto'),
      date: createdAt,
      details: 'Solicitação de assistência registrada',
    },
    {
      id: 'em_andamento',
      title: 'Em Andamento',
      description: 'Assistência sendo prestada',
      status: getStepStatus('em_andamento'),
      date: events.find(e => e.status === 'em_andamento')?.date,
      details: 'Equipe técnica a caminho ou prestando o serviço',
    },
    {
      id: 'finalizado',
      title: 'Finalizado',
      description: 'Assistência concluída',
      status: getStepStatus('finalizado'),
      date: events.find(e => e.status === 'finalizado')?.date,
      details: 'Serviço prestado com sucesso',
    },
  ];

  return <StatusStepperRCorp steps={steps} {...props} />;
}