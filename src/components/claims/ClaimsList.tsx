import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, Edit, FileText, Clock, Trash2 } from 'lucide-react';
import { Claim, ClaimStatus } from '@/types/claims';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClaimsListProps {
  claims: Claim[];
  loading?: boolean;
  onClaimSelect: (claim: Claim) => void;
  onClaimEdit: (claim: Claim) => void;
  onClaimDelete?: (claimId: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function ClaimsList({
  claims,
  loading = false,
  onClaimSelect,
  onClaimEdit,
  onClaimDelete,
  statusFilter = 'all',
  onStatusFilterChange
}: ClaimsListProps) {
  const getStatusColor = (status: ClaimStatus) => {
    const colors = {
      'aberto': 'bg-blue-100 text-blue-800 border-blue-200',
      'em_regulacao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'finalizado': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: ClaimStatus) => {
    const labels = {
      'aberto': 'Aberto',
      'em_regulacao': 'Em Regulação',
      'finalizado': 'Finalizado'
    };
    return labels[status] || status;
  };

  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') return true;
    return claim.status === statusFilter;
  });

  const statusOptions = [
    { value: 'all', label: 'Todos', count: claims.length },
    { value: 'aberto', label: 'Em aberto', count: claims.filter(c => c.status === 'aberto').length },
    { value: 'finalizado', label: 'Finalizados', count: claims.filter(c => c.status === 'finalizado').length },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lista de Sinistros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(option => (
          <Button
            key={option.value}
            variant={statusFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilterChange?.(option.value)}
            className="h-8"
          >
            {option.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {option.count}
            </Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Sinistros
            <Badge variant="outline" className="ml-auto">
              {filteredClaims.length} {filteredClaims.length === 1 ? 'item' : 'itens'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum sinistro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Tabela para Desktop */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Apólice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Movimentação</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">
                          {claim.ticket}
                        </TableCell>
                        <TableCell>
                          {claim.veiculo ? (
                            <div>
                              <p className="font-medium">{claim.veiculo.placa}</p>
                              <p className="text-sm text-muted-foreground">
                                {claim.veiculo.marca} {claim.veiculo.modelo}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem veículo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {claim.apolice ? (
                            <div>
                              <p className="font-medium">{claim.apolice.numero}</p>
                              <p className="text-sm text-muted-foreground">
                                {claim.apolice.seguradora}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem apólice</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(claim.status)}>
                            {getStatusLabel(claim.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {claim.ultima_movimentacao && (
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(claim.ultima_movimentacao), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onClaimSelect(claim)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onClaimSelect(claim)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onClaimEdit(claim)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Documentos
                                </DropdownMenuItem>
                                {onClaimDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => onClaimDelete(claim.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Deletar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards para Mobile */}
              <div className="md:hidden space-y-4">
                {filteredClaims.map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{claim.ticket}</p>
                          <p className="text-sm text-muted-foreground">
                            {claim.veiculo ? `${claim.veiculo.placa} • ${claim.veiculo.marca} ${claim.veiculo.modelo}` : 'Sem veículo'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onClaimSelect(claim)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onClaimSelect(claim)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onClaimEdit(claim)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {onClaimDelete && (
                                <DropdownMenuItem 
                                  onClick={() => onClaimDelete(claim.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(claim.status)}>
                          {getStatusLabel(claim.status)}
                        </Badge>
                        {claim.apolice && (
                          <span className="text-xs text-muted-foreground">
                            {claim.apolice.seguradora}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}