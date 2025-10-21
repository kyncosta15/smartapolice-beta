import React, { useRef } from 'react';
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Button,
  Group,
} from 'react-aria-components';
import type { Key } from 'react-aria-components';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxItem {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxRCorpProps {
  items: ComboboxItem[];
  selectedKey?: string | null;
  onSelectionChange?: (key: Key | null) => void;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  noResultsLabel?: string;
  errorMessage?: string;
  label?: string;
  description?: string;
  className?: string;
  allowsCustomValue?: boolean;
  isRequired?: boolean;
  disableLocalFiltering?: boolean; // Para quando os items já vêm filtrados do backend
}

export function ComboboxRCorp({
  items,
  selectedKey,
  onSelectionChange,
  inputValue,
  onInputChange,
  placeholder = "Selecione...",
  isLoading = false,
  isDisabled = false,
  noResultsLabel = "Nenhum resultado encontrado",
  errorMessage,
  label,
  description,
  className,
  allowsCustomValue = false,
  isRequired = false,
  disableLocalFiltering = false,
}: ComboboxRCorpProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // Filter items based on input value only if local filtering is enabled
  const filteredItems = React.useMemo(() => {
    if (disableLocalFiltering) {
      return items;
    }
    if (!inputValue) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      item.description?.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [items, inputValue, disableLocalFiltering]);

  const selectedItem = items.find(item => item.id === selectedKey);

  return (
    <ComboBox
      className={cn("group flex flex-col gap-1", className)}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      inputValue={inputValue}
      onInputChange={onInputChange}
      allowsCustomValue={allowsCustomValue}
      isDisabled={isDisabled}
      isRequired={isRequired}
      menuTrigger="input"
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

      <Group className="relative flex items-center">
        <Input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pr-8", // Space for chevron
            errorMessage && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder={placeholder}
        />
        
        <Button
          ref={triggerRef}
          className={cn(
            "absolute right-0 top-0 h-full px-3 flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-r-md",
            isDisabled && "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </Group>

      {errorMessage && (
        <div className="text-xs text-destructive mt-1">{errorMessage}</div>
      )}

      <Popover
        className={cn(
          "w-[--trigger-width] bg-popover border border-border rounded-md shadow-md z-50",
          "entering:animate-in entering:fade-in-0 entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out-0 exiting:zoom-out-95",
          "placement-bottom:slide-in-from-top-2 placement-top:slide-in-from-bottom-2"
        )}
      >
        <ListBox
          className="max-h-60 overflow-auto p-1"
          items={filteredItems}
          renderEmptyState={() => (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                  <div className="text-sm text-muted-foreground">Buscando...</div>
                </>
              ) : (
                <>
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {filteredItems.length === 0 && inputValue ? noResultsLabel : "Digite para buscar"}
                  </div>
                </>
              )}
            </div>
          )}
        >
          {(item) => (
            <ListBoxItem
              key={item.id}
              id={item.id}
              textValue={item.label}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                "focus:bg-accent focus:text-accent-foreground",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "data-[selected]:bg-primary data-[selected]:text-primary-foreground"
              )}
            >
              {({ isSelected }) => (
                <>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {highlightMatch(item.label, inputValue)}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {highlightMatch(item.description, inputValue)}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <svg className="ml-2 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query?: string) {
  if (!query) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-primary/20 text-primary font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}