import React from 'react'
import { useListBox, useOption } from 'react-aria'
import { ListState } from 'react-stately'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils'
import { ComboboxItem } from './ComboboxRCorp'

type ListBoxRCorpProps = {
  state: ListState<any>
  items: ComboboxItem[]
  className?: string
}

export const ListBoxRCorp = React.forwardRef<HTMLDivElement, ListBoxRCorpProps>(
  ({ state, items, className, ...props }, ref) => {
    const { listBoxProps } = useListBox(props, state, ref)

    return (
      <div
        {...listBoxProps}
        ref={ref}
        className={cn('py-1', className)}
      >
        {[...state.collection].map((item) => (
          <OptionItem
            key={item.key}
            item={item}
            state={state}
          />
        ))}
      </div>
    )
  }
)

ListBoxRCorp.displayName = 'ListBoxRCorp'

type OptionItemProps = {
  item: any
  state: ListState<any>
}

function OptionItem({ item, state }: OptionItemProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { optionProps, isSelected, isFocused, isPressed } = useOption(
    { key: item.key },
    state,
    ref
  )

  const itemData = item.value || item.props

  return (
    <div
      {...optionProps}
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isFocused && 'bg-accent text-accent-foreground',
        isPressed && 'bg-accent/80',
        item.isDisabled && 'pointer-events-none opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex-1">
        <div className="font-medium">{itemData.label}</div>
        {itemData.description && (
          <div className="text-xs text-muted-foreground">
            {itemData.description}
          </div>
        )}
      </div>
      
      {isSelected && (
        <Check className="ml-2 h-4 w-4 text-primary" />
      )}
    </div>
  )
}