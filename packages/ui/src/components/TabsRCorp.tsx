import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '../lib/utils'

export type TabItem = {
  value: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

export type TabsRCorpProps = {
  items: TabItem[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
  tabsListClassName?: string
  tabsTriggerClassName?: string
  tabsContentClassName?: string
}

export function TabsRCorp({
  items,
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  tabsListClassName,
  tabsTriggerClassName,
  tabsContentClassName,
}: TabsRCorpProps) {
  return (
    <Tabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn('w-full', className)}
    >
      <Tabs.List
        className={cn(
          'inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
          orientation === 'horizontal' ? 'h-10 w-full' : 'flex-col h-auto w-auto',
          tabsListClassName
        )}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
              orientation === 'horizontal' ? 'w-full' : 'w-full justify-start',
              tabsTriggerClassName
            )}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      
      {items.map((item) => (
        <Tabs.Content
          key={item.value}
          value={item.value}
          className={cn(
            'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            tabsContentClassName
          )}
        >
          {item.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}