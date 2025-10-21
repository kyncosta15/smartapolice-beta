import React from 'react';
import {
  Table,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  ResizableTableContainer,
} from 'react-aria-components';
import type { Key } from 'react-aria-components';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableColumn {
  key: string;
  name: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  allowsResizing?: boolean;
  className?: string;
}

export interface TableRCorpProps<T = any> {
  columns: TableColumn[];
  items: T[];
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Set<Key>;
  onSelectionChange?: (keys: Set<Key>) => void;
  sortDescriptor?: {
    column: Key;
    direction: 'ascending' | 'descending';
  };
  onSortChange?: (descriptor: { column: Key; direction: 'ascending' | 'descending' }) => void;
  onAction?: (key: Key) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  renderCell?: (item: T, columnKey: Key) => React.ReactNode;
  getRowId?: (item: T) => Key;
  density?: 'compact' | 'normal' | 'spacious';
}

export function TableRCorp<T extends Record<string, any>>({
  columns,
  items,
  selectionMode = 'none',
  selectedKeys,
  onSelectionChange,
  sortDescriptor,
  onSortChange,
  onAction,
  isLoading = false,
  emptyState,
  className,
  renderCell,
  getRowId,
  density = 'normal',
}: TableRCorpProps<T>) {
  const densityClasses = {
    compact: 'text-xs',
    normal: 'text-sm',
    spacious: 'text-base',
  };

  const rowPadding = {
    compact: 'px-3 py-2',
    normal: 'px-4 py-3',
    spacious: 'px-6 py-4',
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <ResizableTableContainer className={cn("rounded-xl border border-border bg-card shadow-lg overflow-hidden", className)}>
      <Table
        aria-label="Tabela de tickets"
        className="w-full"
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
        onRowAction={onAction}
      >
        <TableHeader>
          {columns.map((column) => (
            <Column
              key={column.key}
              id={column.key}
              isRowHeader={column.isRowHeader}
              allowsSorting={column.allowsSorting}
              width={typeof column.width === 'number' ? column.width : undefined}
              minWidth={column.minWidth}
              maxWidth={column.maxWidth}
              className={cn(
                "px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-foreground/70 bg-muted/80 border-b-2 border-border backdrop-blur-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                column.className
              )}
            >
              {({ allowsSorting, sortDirection }) => (
                <div className="flex items-center gap-2">
                  <span className="truncate">{column.name}</span>
                  {allowsSorting && (
                    <span className="flex flex-col -space-y-1">
                      <ChevronUp
                        className={cn(
                          "h-3 w-3 transition-colors",
                          sortDirection === 'ascending' ? "text-primary" : "text-muted-foreground/30"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-colors",
                          sortDirection === 'descending' ? "text-primary" : "text-muted-foreground/30"
                        )}
                      />
                    </span>
                  )}
                </div>
              )}
            </Column>
          ))}
        </TableHeader>
        <TableBody items={items}>
          {(item) => {
            const rowId = getRowId?.(item) ?? String(item.id);
            
            return (
              <Row 
                id={rowId} 
                className="group hover:bg-primary/5 transition-all duration-200 border-b border-border/50 last:border-0 cursor-pointer hover:shadow-sm"
              >
                {columns.map((column) => {
                  const cellContent = renderCell 
                    ? renderCell(item, column.key as unknown as Key) 
                    : item[column.key];
                  
                  return (
                    <Cell 
                      key={column.key}
                      className={cn(
                        rowPadding[density],
                        "align-middle bg-background/50 group-hover:bg-primary/[0.02] transition-colors",
                        densityClasses[density]
                      )}
                    >
                      {cellContent}
                    </Cell>
                  );
                })}
              </Row>
            );
          }}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

// Default empty state component
export function EmptyTableState({
  title = "Nenhum resultado encontrado",
  description = "Não há dados para exibir no momento.",
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action && action}
    </div>
  );
}