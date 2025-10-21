import React from 'react'
import { ComboBox, Input, Button, Popover, ListBox, ListBoxItem, Label, Text } from 'react-aria-components'
import { ChevronDown, Loader2, Check } from 'lucide-react'
import { cn } from '../lib/utils'

export type ComboboxItem = {
  id: string
  label: string
  description?: string
  disabled?: boolean
}

export type ComboboxRCorpProps = {
  items: ComboboxItem[]
  inputValue?: string
  onInputChange?: (value: string) => void
  selectedKey?: string | null
  onSelectionChange?: (key: string | null) => void
  placeholder?: string
  isLoading?: boolean
  noResultsLabel?: string
  label?: string
  description?: string
  isRequired?: boolean
  isDisabled?: boolean
  className?: string
  popoverClassName?: string
  disableLocalFiltering?: boolean
  allowsCustomValue?: boolean
}

export function ComboboxRCorp({
  items,
  inputValue,
  onInputChange,
  selectedKey,
  onSelectionChange,
  placeholder = 'Buscar...',
  isLoading = false,
  noResultsLabel = 'Nenhum resultado encontrado',
  label,
  description,
  isRequired = false,
  isDisabled = false,
  className,
  popoverClassName,
  disableLocalFiltering = false,
  allowsCustomValue = false,
}: ComboboxRCorpProps) {
  // Don't filter locally if items already come filtered from backend
  const displayItems = disableLocalFiltering ? items : items;

  return (
    <ComboBox
      inputValue={inputValue}
      onInputChange={onInputChange}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      isDisabled={isDisabled}
      className={cn('relative w-full', className)}
      menuTrigger="input"
      allowsCustomValue={allowsCustomValue}
    >
      {label && (
        <Label className="text-sm font-medium text-foreground mb-2 block">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          placeholder={placeholder}
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'pr-10'
          )}
        />

        <Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {description && (
        <Text slot="description" className="text-sm text-muted-foreground mt-1">
          {description}
        </Text>
      )}

      <Popover
        className={cn(
          'w-[--trigger-width] mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50 entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out',
          popoverClassName
        )}
      >
        <ListBox className="outline-none">
          {displayItems.length === 0 && !isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {noResultsLabel}
            </div>
          ) : (
            displayItems.map((item) => (
              <ListBoxItem
                key={item.id}
                id={item.id}
                textValue={item.label}
                isDisabled={item.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:bg-accent focus:text-accent-foreground',
                  'pressed:bg-accent/80',
                  'selected:bg-accent/50',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                {({ isSelected }) => (
                  <>
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </>
                )}
              </ListBoxItem>
            ))
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  )
}