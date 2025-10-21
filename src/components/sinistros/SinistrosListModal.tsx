import React, { useState, useEffect, useId } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { FilterChips } from './FilterChips';
import { useFilterState } from '@/hooks/useFilterState';
import { useClaims } from '@/hooks/useClaims';
import { useToast } from '@/hooks/use-toast';
import { Search, X, ChevronUpIcon, ChevronDownIcon, ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Claim, Assistance, ClaimStatus } from '@/types/claims';
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  PaginationState, 
  SortingState, 
  useReactTable 
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface SinistrosListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialFilter?: {
    tipo?: 'sinistro' | 'assistencia';
    status?: string;
    periodo?: 'last60d';
  };
}

type TableItem = (Claim | Assistance) & {
  displayType: 'Sinistro' | 'Assistência';
};

export function SinistrosListModal({ 
  open, 
  onOpenChange, 
  title, 
  initialFilter 
}: SinistrosListModalProps) {
  const id = useId();
  const [currentType, setCurrentType] = useState<'sinistro' | 'assistencia'>('sinistro');
  
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ]);
  
  const {
    filters,
    activeFilterChips,
    updateFilter,
    removeFilter,
    clearAllFilters
  } = useFilterState();
  
  const { toast } = useToast();

  // Aplicar filtro inicial quando modal abre
  useEffect(() => {
    if (open && initialFilter) {
      console.log('🔍 Aplicando filtro inicial:', initialFilter);
      clearAllFilters();
      
      if (initialFilter.tipo) {
        setCurrentType(initialFilter.tipo);
      }
      
      Object.entries(initialFilter).forEach(([key, value]) => {
        if (value) {
          updateFilter(key as any, value);
        }
      });
    }
  }, [open, initialFilter]);

  // Resetar paginação quando filtro muda
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [currentType, filters.status, filters.search]);

  // Determinar tipo atual baseado em filtro ou estado
  const tipoAtual = (filters.tipo as 'sinistro' | 'assistencia') || currentType;

  // Buscar dados com React Query
  const { data: rawData, isLoading, isFetching } = useClaims({
    tipo: tipoAtual,
    status: filters.status,
    search: filters.search,
    page: 1,
    limit: 1000 // Buscar todos para paginação local
  });

  // Transformar dados para TableItem
  const tableData: TableItem[] = (rawData || []).map(item => ({
    ...item,
    displayType: tipoAtual === 'sinistro' ? 'Sinistro' as const : 'Assistência' as const
  }));

  // Colunas da tabela
  const columns: ColumnDef<TableItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true :
            table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      size: 28,
      enableSorting: false,
    },
    {
      header: "Tipo",
      accessorKey: "displayType",
      cell: ({ row }) => (
        <Badge variant={row.original.displayType === 'Sinistro' ? 'default' : 'secondary'}>
          {row.original.displayType}
        </Badge>
      ),
      size: 120,
    },
    {
      header: "Veículo",
      accessorKey: "veiculo.placa",
      cell: ({ row }) => (
        <div className="font-medium">
          <div>{row.original.veiculo.placa}</div>
          <div className="text-xs text-muted-foreground">{row.original.veiculo.modelo || '-'}</div>
        </div>
      ),
      size: 180,
    },
    {
      header: "Proprietário",
      accessorKey: "veiculo.proprietario_nome",
      cell: ({ row }) => (
        <div>{row.original.veiculo.proprietario_nome || '-'}</div>
      ),
      size: 200,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isClaim = 'valor_estimado' in row.original;
        
        let variant: 'default' | 'secondary' | 'outline' = 'default';
        let label: string = '';
        
        if (isClaim) {
          // Claim statuses
          const claimStatus = status as ClaimStatus;
          variant = claimStatus === 'aberto' ? 'default' : 
                   claimStatus === 'em_regulacao' ? 'outline' : 
                   claimStatus === 'finalizado' ? 'secondary' : 'outline';
          label = claimStatus === 'aberto' ? 'Em Aberto' :
                 claimStatus === 'em_regulacao' ? 'Em Regulação' :
                 claimStatus === 'finalizado' ? 'Finalizado' : String(claimStatus);
        } else {
          // Assistance statuses
          const assistStatus = status as 'aberto' | 'finalizado';
          variant = assistStatus === 'aberto' ? 'default' : 'secondary';
          label = assistStatus === 'aberto' ? 'Em Aberto' : 'Finalizado';
        }
        
        return <Badge variant={variant}>{label}</Badge>;
      },
      size: 120,
    },
    {
      header: "Valor Estimado",
      accessorKey: "valor_estimado",
      cell: ({ row }) => {
        const valor = 'valor_estimado' in row.original ? row.original.valor_estimado : null;
        if (!valor) return '-';
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(valor);
        return <div className="font-medium">{formatted}</div>;
      },
      size: 150,
    },
    {
      header: "Data",
      accessorKey: "created_at",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div>
            <div>{date.toLocaleDateString('pt-BR')}</div>
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
      size: 120,
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  const handleClose = () => {
    clearAllFilters();
    setPagination({ pageIndex: 0, pageSize: 10 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4 flex-shrink-0 border-b pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Em Aberto</SelectItem>
                  <SelectItem value="closed">Finalizados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.seguradora || 'all'} onValueChange={(value) => updateFilter('seguradora', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seguradora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as seguradoras</SelectItem>
                  <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                  <SelectItem value="Bradesco Seguros">Bradesco Seguros</SelectItem>
                  <SelectItem value="Suhai Seguradora">Suhai Seguradora</SelectItem>
                  <SelectItem value="Allianz">Allianz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa, chassi, proprietário ou modelo"
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <FilterChips
            activeFilters={activeFilterChips}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="flex-1 overflow-hidden rounded-md border bg-background">
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            style={{ width: `${header.getSize()}px` }}
                            className="h-11"
                          >
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <div
                                className={cn(
                                  header.column.getCanSort() &&
                                    "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                                onKeyDown={(e) => {
                                  if (
                                    header.column.getCanSort() &&
                                    (e.key === "Enter" || e.key === " ")
                                  ) {
                                    e.preventDefault();
                                    header.column.getToggleSortingHandler()?.(e);
                                  }
                                }}
                                tabIndex={header.column.getCanSort() ? 0 : undefined}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: (
                                    <ChevronUpIcon
                                      className="shrink-0 opacity-60"
                                      size={16}
                                      aria-hidden="true"
                                    />
                                  ),
                                  desc: (
                                    <ChevronDownIcon
                                      className="shrink-0 opacity-60"
                                      size={16}
                                      aria-hidden="true"
                                    />
                                  ),
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-8 flex-shrink-0">
            {/* Results per page */}
            <div className="flex items-center gap-3">
              <Label htmlFor={id} className="max-sm:sr-only">
                Linhas por página
              </Label>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                  <SelectValue placeholder="Selecione o número de resultados" />
                </SelectTrigger>
                <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Page number information */}
            <div className="flex grow justify-end text-sm whitespace-nowrap text-muted-foreground">
              <p
                className="text-sm whitespace-nowrap text-muted-foreground"
                aria-live="polite"
              >
                <span className="text-foreground">
                  {table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    1}
                  -
                  {Math.min(
                    Math.max(
                      table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        table.getState().pagination.pageSize,
                      0
                    ),
                    table.getRowCount()
                  )}
                </span>{" "}
                de{" "}
                <span className="text-foreground">
                  {table.getRowCount().toString()}
                </span>
              </p>
            </div>
            {/* Pagination buttons */}
            <div>
              <Pagination>
                <PaginationContent>
                  {/* First page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.firstPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Ir para primeira página"
                    >
                      <ChevronFirstIcon size={16} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Previous page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Ir para página anterior"
                    >
                      <ChevronLeftIcon size={16} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Next page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Ir para próxima página"
                    >
                      <ChevronRightIcon size={16} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                  {/* Last page button */}
                  <PaginationItem>
                    <Button
                      size="icon"
                      variant="outline"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => table.lastPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Ir para última página"
                    >
                      <ChevronLastIcon size={16} aria-hidden="true" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}