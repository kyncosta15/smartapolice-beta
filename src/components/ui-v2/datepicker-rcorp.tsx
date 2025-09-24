import React from 'react';
import {
  DatePicker,
  Label,
  Group,
  Button,
  DateInput,
  DateSegment,
  Popover,
  Dialog,
  Calendar,
  CalendarGrid,
  CalendarCell,
  Heading,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
} from 'react-aria-components';
import type { DateValue } from 'react-aria-components';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerRCorpProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  value?: DateValue;
  onChange?: (date: DateValue | null) => void;
  minValue?: DateValue;
  maxValue?: DateValue;
  placeholder?: string;
  className?: string;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
}

export function DatePickerRCorp({
  label,
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  value,
  onChange,
  minValue,
  maxValue,
  placeholder = "Selecione uma data",
  className,
  granularity = 'day',
}: DatePickerRCorpProps) {
  return (
    <DatePicker
      className={cn("group flex flex-col gap-1", className)}
      value={value}
      onChange={onChange}
      minValue={minValue}
      maxValue={maxValue}
      isRequired={isRequired}
      isDisabled={isDisabled}
      granularity={granularity}
    >
      {label && (
        <Label className="text-sm font-medium text-foreground cursor-default">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      {description && (
        <div className="text-xs text-muted-foreground mb-1">{description}</div>
      )}

      <Group
        className={cn(
          "flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50",
          errorMessage && "border-destructive focus-within:ring-destructive"
        )}
      >
        <DateInput className="flex flex-1 gap-1">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={cn(
                "px-1 py-0.5 rounded text-foreground",
                "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                "data-[placeholder]:text-muted-foreground",
                "data-[type=literal]:text-muted-foreground"
              )}
            />
          )}
        </DateInput>
        
        <Button
          className={cn(
            "ml-2 p-1 rounded text-muted-foreground hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </Group>

      {errorMessage && (
        <div className="text-xs text-destructive mt-1">{errorMessage}</div>
      )}

      <Popover
        className={cn(
          "w-auto bg-popover border border-border rounded-md shadow-md",
          "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
          "placement-bottom:slide-in-from-top-2 placement-top:slide-in-from-bottom-2"
        )}
      >
        <Dialog className="p-4 outline-none">
          <Calendar>
            <header className="flex items-center justify-between mb-4">
              <Button
                slot="previous"
                className={cn(
                  "p-2 rounded hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Heading className="text-sm font-medium" />
              
              <Button
                slot="next"
                className={cn(
                  "p-2 rounded hover:bg-accent hover:text-accent-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </header>

            <CalendarGrid className="border-collapse">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-xs font-medium text-muted-foreground p-2 text-center">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={cn(
                      "w-8 h-8 text-sm cursor-pointer rounded flex items-center justify-center",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary",
                      "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
                      "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-50"
                    )}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}

// Helper component for form integration
export function FormDatePicker({
  name,
  label,
  description,
  errorMessage,
  isRequired,
  value,
  onChange,
  ...props
}: DatePickerRCorpProps & {
  name?: string;
}) {
  return (
    <div className="space-y-1">
      <DatePickerRCorp
        label={label}
        description={description}
        errorMessage={errorMessage}
        isRequired={isRequired}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  );
}