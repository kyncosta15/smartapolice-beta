import React from 'react';
import {
  Tooltip,
  TooltipTrigger,
  OverlayArrow,
} from 'react-aria-components';
import { cn } from '@/lib/utils';

export interface TooltipRCorpProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top start' | 'top end' | 'bottom start' | 'bottom end';
  delay?: number;
  closeDelay?: number;
  isDisabled?: boolean;
  className?: string;
  offset?: number;
  crossOffset?: number;
  showArrow?: boolean;
}

export function TooltipRCorp({
  children,
  content,
  placement = 'top',
  delay = 700,
  closeDelay = 0,
  isDisabled = false,
  className,
  offset = 8,
  crossOffset = 0,
  showArrow = true,
}: TooltipRCorpProps) {
  if (isDisabled) {
    return <>{children}</>;
  }

  return (
    <TooltipTrigger
      delay={delay}
      closeDelay={closeDelay}
    >
      {children}
      <Tooltip
        placement={placement}
        offset={offset}
        crossOffset={crossOffset}
        className={cn(
          "group",
          "bg-popover text-popover-foreground border border-border rounded-md shadow-md",
          "px-3 py-2 text-sm max-w-xs z-50",
          "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
          "placement-top:slide-in-from-bottom-2",
          "placement-bottom:slide-in-from-top-2",
          "placement-left:slide-in-from-right-2",
          "placement-right:slide-in-from-left-2",
          className
        )}
      >
        {showArrow && (
          <OverlayArrow>
            <svg
              width={12}
              height={6}
              viewBox="0 0 12 6"
              className="fill-popover stroke-border group-placement-top:rotate-180 group-placement-left:rotate-90 group-placement-right:-rotate-90"
            >
              <path d="M0 0 L6 6 L12 0" />
            </svg>
          </OverlayArrow>
        )}
        <div className="relative z-10">{content}</div>
      </Tooltip>
    </TooltipTrigger>
  );
}

// Specialized tooltip variants for common use cases
export function HelpTooltip({
  children,
  content,
  ...props
}: Omit<TooltipRCorpProps, 'children' | 'content'> & {
  children: React.ReactNode;
  content: string;
}) {
  return (
    <TooltipRCorp
      content={
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5">
            ?
          </div>
          <div className="text-xs leading-relaxed">{content}</div>
        </div>
      }
      placement="top"
      {...props}
    >
      {children}
    </TooltipRCorp>
  );
}

export function StatusTooltip({
  children,
  content,
  status,
  ...props
}: Omit<TooltipRCorpProps, 'children' | 'content'> & {
  children: React.ReactNode;
  content: string;
  status: 'success' | 'warning' | 'error' | 'info';
}) {
  const statusColors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200', 
    error: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  };

  return (
    <TooltipRCorp
      content={content}
      className={cn(
        "border-l-4 border-l-current",
        statusColors[status]
      )}
      {...props}
    >
      {children}
    </TooltipRCorp>
  );
}