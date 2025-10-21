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
  console.log('🔍 TableRCorp - Props recebidos:', {
    itemsLength: items.length,
    isLoading,
    columnsLength: columns.length,
    firstItem: items[0]
  });

  const densityClasses = {
    compact: 'text-xs',
    normal: 'text-sm',
    spacious: 'text-base',
  };

  const rowPadding = {
    compact: 'px-2 py-1',
    normal: 'px-4 py-2',
    spacious: 'px-6 py-3',
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
    <ResizableTableContainer className={cn("rounded-md border overflow-auto", className)}>
      <Table
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
                "px-4 py-3 text-left font-medium text-muted-foreground border-b",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                densityClasses[density],
                column.className
              )}
            >
              {({ allowsSorting, sortDirection }) => (
                <div className="flex items-center gap-2">
                  <span className="truncate">{column.name}</span>
                  {allowsSorting && (
                    <span className="flex flex-col">
                      <ChevronUp
                        className={cn(
                          "h-3 w-3 -mb-1",
                          sortDirection === 'ascending' ? "text-foreground" : "text-muted-foreground/50"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "h-3 w-3",
                          sortDirection === 'descending' ? "text-foreground" : "text-muted-foreground/50"
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
          {(item) => (
            <Row
              id={getRowId?.(item) ?? String(item.id)}
              className={cn(
                "border-b hover:bg-muted/50 focus:bg-muted focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                onAction && "cursor-pointer"
              )}
            >
              {(columnKey) => (
                <Cell
                  className={cn(
                    rowPadding[density],
                    "align-middle border-b-0",
                    densityClasses[density]
                  )}
                >
                  {renderCell ? renderCell(item, columnKey as unknown as Key) : item[String(columnKey)]}
                </Cell>
              )}
            </Row>
          )}
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