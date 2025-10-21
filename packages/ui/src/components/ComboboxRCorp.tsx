import React from 'react'
import { useComboBox } from 'react-aria'
import { useComboBoxState } from 'react-stately'
import { useButton } from 'react-aria'
import { useFocus } from 'react-aria'
import { ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { ListBoxRCorp } from './ListBoxRCorp'

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
}: ComboboxRCorpProps) {
  const state = useComboBoxState({
    children: items.map(item => ({
      key: item.id,
      textValue: item.label,
      isDisabled: item.disabled,
      ...item,
    })),
    inputValue,
    onInputChange,
    selectedKey,
    onSelectionChange,
    isDisabled,
  })

  const inputRef = React.useRef<HTMLInputElement>(null)
  const listBoxRef = React.useRef<HTMLDivElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  const {
    inputProps,
    listBoxProps,
    labelProps,
    descriptionProps,
  } = useComboBox(
    {
      label,
      description,
      placeholder,
      isRequired,
      isDisabled,
    },
    state,
    inputRef
  )

  const { buttonProps } = useButton(
    {
      onPress: () => state.toggle(),
      isDisabled,
    },
    React.useRef<HTMLButtonElement>(null)
  )

  const { focusProps } = useFocus({
    onFocus: () => state.open(),
  })

  // Abrir automaticamente quando o usuário digitar
  React.useEffect(() => {
    if (inputValue && inputValue.length > 0) {
      state.open()
    }
  }, [inputValue, state])

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label {...labelProps} className="text-sm font-medium text-foreground mb-2 block">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          {...inputProps}
          {...focusProps}
          ref={inputRef}
          className={cn(
            'flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'pr-10' // espaço para o ícone
          )}
          placeholder={placeholder}
        />

        <button
          {...buttonProps}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
          tabIndex={-1}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                state.isOpen && 'transform rotate-180'
              )}
            />
          )}
        </button>
      </div>

      {description && (
        <p {...descriptionProps} className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      )}

      {state.isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto',
            popoverClassName
          )}
        >
          {items.length === 0 && !isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {noResultsLabel}
            </div>
          ) : (
            <ListBoxRCorp
              {...listBoxProps}
              ref={listBoxRef}
              state={state}
              items={items}
            />
          )}
        </div>
      )}
    </div>
  )
}