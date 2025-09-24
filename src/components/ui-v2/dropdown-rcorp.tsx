import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DropdownItem = {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  variant?: 'default' | 'destructive'
  onClick?: () => void
}

export type DropdownSubMenu = {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  items: DropdownItem[]
}

export type DropdownSeparator = {
  type: 'separator'
}

export type DropdownRCorpProps = {
  trigger: React.ReactNode
  items: (DropdownItem | DropdownSubMenu | DropdownSeparator)[]
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

function isDropdownItem(item: any): item is DropdownItem {
  return 'label' in item && !('items' in item) && item.type !== 'separator'
}

function isDropdownSubMenu(item: any): item is DropdownSubMenu {
  return 'items' in item && Array.isArray(item.items)
}

function isDropdownSeparator(item: any): item is DropdownSeparator {
  return item.type === 'separator'
}

export function DropdownRCorp({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
  className,
}: DropdownRCorpProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {items.map((item, index) => {
            if (isDropdownSeparator(item)) {
              return (
                <DropdownMenu.Separator
                  key={`separator-${index}`}
                  className="my-1 h-px bg-muted"
                />
              )
            }

            if (isDropdownSubMenu(item)) {
              return (
                <DropdownMenu.Sub key={item.id}>
                  <DropdownMenu.SubTrigger className="flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent">
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                      {item.items.map((subItem) => (
                        <DropdownMenu.Item
                          key={subItem.id}
                          className={cn(
                            'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                            subItem.variant === 'destructive' && 'focus:bg-destructive focus:text-destructive-foreground'
                          )}
                          disabled={subItem.disabled}
                          onClick={subItem.onClick}
                        >
                          {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                          {subItem.label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
              )
            }

            if (isDropdownItem(item)) {
              return (
                <DropdownMenu.Item
                  key={item.id}
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    item.variant === 'destructive' && 'focus:bg-destructive focus:text-destructive-foreground'
                  )}
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </DropdownMenu.Item>
              )
            }

            return null
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}